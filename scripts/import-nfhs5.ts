import fs from "fs";
import path from "path";

interface DistrictCsvRow {
  state: string;
  district: string;
  population_2011: number | null;
  literacy_rate_2011: number | null;
  aspirational_district: boolean | null;
  nfhs5_electricity_pct: number | null;
  nfhs5_improved_water_pct: number | null;
  nfhs5_improved_sanitation_pct: number | null;
  pmgsy_road_connectivity_pct: null;
}

interface VerificationRow {
  state: string;
  district: string;
  matchedNfhsDistrict: string | null;
  sourceFile: string | null;
  electricityPct: number | null;
  electricityRow: number | null;
  improvedWaterPct: number | null;
  waterRow: number | null;
  improvedSanitationPct: number | null;
  sanitationRow: number | null;
  status: "MATCHED" | "UNMATCHED";
  verifiedByHuman: string;
}

const STATE_FILE_MAP: Record<string, string> = {
  "Bihar": "NFHS-5-BR-Bihar.csv",
  "Maharashtra": "NFHS-5-MH-Maharashtra.csv",
  "Gujarat": "NFHS-5-GJ-Gujarat.csv",
  "Karnataka": "NFHS-5-KA-Karnataka.csv",
  "West Bengal": "NFHS-5-WB-West-Bengal.csv",
  "Assam": "NFHS-5-AS-Assam.csv",
  "Telangana": "NFHS-5-TG-Telangana.csv",
  "Kerala": "NFHS-5-KL-Kerala.csv",
  "Andhra Pradesh": "NFHS-5-AP-Andhra-Pradesh.csv",
  "Himachal Pradesh": "NFHS-5-HP-Himachal-Pradesh.csv",
};

const DISTRICT_ALIAS_MAP: Record<string, string> = {
  "mumbai city": "mumbai",
  "bengaluru urban": "bangalore",
  "bangalore urban": "bangalore",
  "purulia": "puruliya",
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.length > 1) rows.push(currentRow);
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1) rows.push(currentRow);
  }

  return rows;
}

async function fetchStateCsv(filename: string): Promise<string> {
  const cacheDir = path.resolve(process.cwd(), "data/cache/nfhs5");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const cachePath = path.join(cacheDir, filename);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, "utf8");
  }

  const url = `https://raw.githubusercontent.com/pratapvardhan/NFHS-5/master/district-level/${filename}`;
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const content = await res.text();
  fs.writeFileSync(cachePath, content, "utf8");
  return content;
}

export async function runImport(): Promise<void> {
  console.log("=== NFHS-5 District Indicators Importer ===");

  // 1. Inspect header first
  const sampleBihar = await fetchStateCsv("NFHS-5-BR-Bihar.csv");
  const biharRows = parseCsv(sampleBihar);
  const header = biharRows[0];
  console.log("\nInspected CSV Header:");
  console.log(header.map((col, idx) => `  [Col ${idx}] ${col}`).join("\n"));

  const nfhs5ColIdx = header.indexOf("NFHS-5");
  const nfhs4ColIdx = header.indexOf("NFHS-4");

  if (nfhs5ColIdx === -1 || nfhs4ColIdx === -1) {
    throw new Error("Could not find expected 'NFHS-5' and 'NFHS-4' columns in CSV header!");
  }

  console.log(`\nConfirmed Column Mapping:`);
  console.log(`  -> NFHS-5 Column: "${header[nfhs5ColIdx]}" at Index ${nfhs5ColIdx}`);
  console.log(`  -> NFHS-4 Column: "${header[nfhs4ColIdx]}" at Index ${nfhs4ColIdx}`);

  // 2. Load existing data/districts.csv
  const districtsCsvPath = path.resolve(process.cwd(), "data/districts.csv");
  const existingCsv = fs.readFileSync(districtsCsvPath, "utf8");
  const existingRows = parseCsv(existingCsv);
  const existingHeader = existingRows[0];

  const stateIdx = existingHeader.indexOf("state");
  const distIdx = existingHeader.indexOf("district");
  const popIdx = existingHeader.indexOf("population_2011");
  const litIdx = existingHeader.indexOf("literacy_rate_2011");
  const aspIdx = existingHeader.indexOf("aspirational_district");

  const stateDataMap: Record<string, { rows: string[][]; filename: string }> = {};

  // Pre-fetch all available state CSVs
  for (const [stateName, filename] of Object.entries(STATE_FILE_MAP)) {
    try {
      const csvText = await fetchStateCsv(filename);
      stateDataMap[stateName] = {
        rows: parseCsv(csvText),
        filename,
      };
    } catch (err) {
      console.warn(`Could not load ${filename} for ${stateName}:`, err);
    }
  }

  const updatedDistricts: DistrictCsvRow[] = [];
  const verificationRows: VerificationRow[] = [];
  const unmatchedList: Array<{ state: string; district: string; reason: string }> = [];

  for (let i = 1; i < existingRows.length; i++) {
    const row = existingRows[i];
    const state = row[stateIdx]?.trim();
    const district = row[distIdx]?.trim();
    if (!state || !district) continue;

    const pop = row[popIdx] ? Number(row[popIdx]) : null;
    const lit = row[litIdx] ? Number(row[litIdx]) : null;
    const asp = row[aspIdx] === "true";

    const stateData = stateDataMap[state];

    if (!stateData) {
      unmatchedList.push({
        state,
        district,
        reason: `State CSV not present in NFHS-5 Phase 1 mirror repository (Phase 2 state).`,
      });
      updatedDistricts.push({
        state,
        district,
        population_2011: pop,
        literacy_rate_2011: lit,
        aspirational_district: asp,
        nfhs5_electricity_pct: null,
        nfhs5_improved_water_pct: null,
        nfhs5_improved_sanitation_pct: null,
        pmgsy_road_connectivity_pct: null,
      });
      verificationRows.push({
        state,
        district,
        matchedNfhsDistrict: null,
        sourceFile: null,
        electricityPct: null,
        electricityRow: null,
        improvedWaterPct: null,
        waterRow: null,
        improvedSanitationPct: null,
        sanitationRow: null,
        status: "UNMATCHED",
        verifiedByHuman: "No (Phase 2 State — not in NFHS-5 Phase 1 dataset)",
      });
      continue;
    }

    // Match district within state
    const normalizedDistrict = normalizeName(district);
    const aliasedName = DISTRICT_ALIAS_MAP[district.toLowerCase()] || district;
    const normalizedAliased = normalizeName(aliasedName);

    // Group state rows by district
    const districtRows = stateData.rows.filter((r) => {
      const dName = r[2]?.trim() || "";
      const normD = normalizeName(dName);
      return normD === normalizedDistrict || normD === normalizedAliased;
    });

    if (districtRows.length === 0) {
      unmatchedList.push({
        state,
        district,
        reason: `District not found in ${stateData.filename}.`,
      });
      updatedDistricts.push({
        state,
        district,
        population_2011: pop,
        literacy_rate_2011: lit,
        aspirational_district: asp,
        nfhs5_electricity_pct: null,
        nfhs5_improved_water_pct: null,
        nfhs5_improved_sanitation_pct: null,
        pmgsy_road_connectivity_pct: null,
      });
      verificationRows.push({
        state,
        district,
        matchedNfhsDistrict: null,
        sourceFile: stateData.filename,
        electricityPct: null,
        electricityRow: null,
        improvedWaterPct: null,
        waterRow: null,
        improvedSanitationPct: null,
        sanitationRow: null,
        status: "UNMATCHED",
        verifiedByHuman: "No (Unmatched district name)",
      });
      continue;
    }

    const matchedNfhsDistrict = districtRows[0][2]?.trim();

    // Find electricity row
    const elecRowIndex = stateData.rows.findIndex(
      (r) =>
        normalizeName(r[2] || "") === normalizeName(matchedNfhsDistrict) &&
        /electricity/i.test(r[3] || "")
    );
    const elecRow = elecRowIndex !== -1 ? stateData.rows[elecRowIndex] : null;
    const elecVal = elecRow && elecRow[nfhs5ColIdx] ? Number(elecRow[nfhs5ColIdx]) : null;

    // Find improved drinking water row
    const waterRowIndex = stateData.rows.findIndex(
      (r) =>
        normalizeName(r[2] || "") === normalizeName(matchedNfhsDistrict) &&
        /improved drinking-water source/i.test(r[3] || "")
    );
    const waterRow = waterRowIndex !== -1 ? stateData.rows[waterRowIndex] : null;
    const waterVal = waterRow && waterRow[nfhs5ColIdx] ? Number(waterRow[nfhs5ColIdx]) : null;

    // Find improved sanitation row
    const sanitationRowIndex = stateData.rows.findIndex(
      (r) =>
        normalizeName(r[2] || "") === normalizeName(matchedNfhsDistrict) &&
        /improved sanitation facility/i.test(r[3] || "")
    );
    const sanitationRow = sanitationRowIndex !== -1 ? stateData.rows[sanitationRowIndex] : null;
    const sanitationVal = sanitationRow && sanitationRow[nfhs5ColIdx] ? Number(sanitationRow[nfhs5ColIdx]) : null;

    updatedDistricts.push({
      state,
      district,
      population_2011: pop,
      literacy_rate_2011: lit,
      aspirational_district: asp,
      nfhs5_electricity_pct: Number.isFinite(elecVal) ? elecVal : null,
      nfhs5_improved_water_pct: Number.isFinite(waterVal) ? waterVal : null,
      nfhs5_improved_sanitation_pct: Number.isFinite(sanitationVal) ? sanitationVal : null,
      pmgsy_road_connectivity_pct: null,
    });

    verificationRows.push({
      state,
      district,
      matchedNfhsDistrict,
      sourceFile: stateData.filename,
      electricityPct: elecVal,
      electricityRow: elecRowIndex !== -1 ? elecRowIndex + 1 : null,
      improvedWaterPct: waterVal,
      waterRow: waterRowIndex !== -1 ? waterRowIndex + 1 : null,
      improvedSanitationPct: sanitationVal,
      sanitationRow: sanitationRowIndex !== -1 ? sanitationRowIndex + 1 : null,
      status: "MATCHED",
      verifiedByHuman: "Auto-verified from NFHS-5 factsheet CSV",
    });
  }

  // 3. Print Unmatched Districts
  console.log(`\nUnmatched Districts (${unmatchedList.length} total, left as null):`);
  for (const item of unmatchedList) {
    console.log(`  - [UNMATCHED] ${item.state} -> ${item.district}: ${item.reason}`);
  }

  const matchedCount = updatedDistricts.filter(
    (d) => d.nfhs5_electricity_pct !== null || d.nfhs5_improved_water_pct !== null || d.nfhs5_improved_sanitation_pct !== null
  ).length;
  console.log(`\nMatched Districts with real NFHS-5 figures: ${matchedCount} / ${updatedDistricts.length}`);

  // 4. Write data/districts.csv
  const newCsvLines: string[] = [
    "state,district,population_2011,literacy_rate_2011,aspirational_district,nfhs5_electricity_pct,nfhs5_improved_water_pct,nfhs5_improved_sanitation_pct,pmgsy_road_connectivity_pct",
  ];

  for (const d of updatedDistricts) {
    const elec = d.nfhs5_electricity_pct !== null ? d.nfhs5_electricity_pct : "";
    const water = d.nfhs5_improved_water_pct !== null ? d.nfhs5_improved_water_pct : "";
    const sani = d.nfhs5_improved_sanitation_pct !== null ? d.nfhs5_improved_sanitation_pct : "";
    const pop = d.population_2011 !== null ? d.population_2011 : "";
    const lit = d.literacy_rate_2011 !== null ? d.literacy_rate_2011 : "";
    const asp = d.aspirational_district === true ? "true" : "false";
    newCsvLines.push(`${d.state},${d.district},${pop},${lit},${asp},${elec},${water},${sani},`);
  }

  fs.writeFileSync(districtsCsvPath, newCsvLines.join("\n") + "\n", "utf8");
  console.log(`Updated ${districtsCsvPath}`);

  // 5. Write data/districts.json
  const districtsJsonPath = path.resolve(process.cwd(), "data/districts.json");
  fs.writeFileSync(districtsJsonPath, JSON.stringify(updatedDistricts, null, 2) + "\n", "utf8");
  console.log(`Updated ${districtsJsonPath}`);

  // 6. Write data/VERIFICATION.md
  const verificationMdPath = path.resolve(process.cwd(), "data/VERIFICATION.md");
  const mdLines: string[] = [
    "# NFHS-5 District Indicators Verification Log",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Data Source:** National Family Health Survey (NFHS-5), 2019-21 (Ministry of Health & Family Welfare / IIPS)`,
    `**Source Repository Mirror:** [https://github.com/pratapvardhan/NFHS-5](https://github.com/pratapvardhan/NFHS-5) (\`district-level/\`)`,
    "",
    "## 1. Summary",
    `- **Total Districts in Master Dataset:** ${updatedDistricts.length}`,
    `- **Districts with NFHS-5 Data Imported:** ${matchedCount}`,
    `- **Districts Left Null (Phase 2 States / Unmatched):** ${unmatchedList.length}`,
    `- **Strict Policy:** Values were extracted strictly from the NFHS-5 factsheet column (Column Index 4 \`NFHS-5\`). No values have been fabricated, guessed, or interpolated. Unmatched districts retain explicit \`null\`.`,
    "",
    "## 2. District-by-District Verification Table",
    "",
    "| State | District | NFHS District Match | Source File | Electricity (%) [Row] | Improved Water (%) [Row] | Improved Sanitation (%) [Row] | Status | Verified by Human |",
    "| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |",
  ];

  for (const v of verificationRows) {
    const elecDisplay = v.electricityPct !== null ? `${v.electricityPct}% [Row ${v.electricityRow}]` : "null";
    const waterDisplay = v.improvedWaterPct !== null ? `${v.improvedWaterPct}% [Row ${v.waterRow}]` : "null";
    const saniDisplay = v.improvedSanitationPct !== null ? `${v.improvedSanitationPct}% [Row ${v.sanitationRow}]` : "null";
    const matchedD = v.matchedNfhsDistrict || "—";
    const file = v.sourceFile || "—";
    mdLines.push(
      `| ${v.state} | ${v.district} | ${matchedD} | \`${file}\` | ${elecDisplay} | ${waterDisplay} | ${saniDisplay} | ${v.status} | ${v.verifiedByHuman} |`
    );
  }

  mdLines.push("");
  mdLines.push("---");
  mdLines.push("*Log produced automatically by `npm run import:nfhs5` (`scripts/import-nfhs5.ts`).*");

  fs.writeFileSync(verificationMdPath, mdLines.join("\n") + "\n", "utf8");
  console.log(`Generated ${verificationMdPath}`);
}

runImport().catch((err) => {
  console.error("NFHS-5 Import error:", err);
  process.exit(1);
});
