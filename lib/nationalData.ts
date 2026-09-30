import districtsJson from "../data/districts.json";

export interface NationalDistrictRecord {
  state: string;
  district: string;
  aliases?: string[];
  population_2011: number | null;
  literacy_rate_2011: number | null;
  aspirational_district: boolean | null;
  nfhs5_electricity_pct: number | null;
  nfhs5_improved_water_pct: number | null;
  nfhs5_improved_sanitation_pct: number | null;
  pmgsy_road_connectivity_pct: number | null;
  // Backward compatibility accessors
  tap_water_coverage_pct?: number | null;
  sanitation_coverage_pct?: number | null;
}

export interface OfficialSchemeInfo {
  name: string;
  ministry: string;
  category: string;
}

export const OFFICIAL_INDIA_SCHEMES: Record<string, OfficialSchemeInfo> = {
  water: {
    name: "Jal Jeevan Mission (JJM) / AMRUT 2.0",
    ministry: "Ministry of Jal Shakti / MoHUA",
    category: "water",
  },
  roads: {
    name: "Pradhan Mantri Gram Sadak Yojana (PMGSY) / CRIF",
    ministry: "Ministry of Rural Development / MoRTH",
    category: "roads",
  },
  sanitation: {
    name: "Swachh Bharat Mission (SBM 2.0)",
    ministry: "Ministry of Housing & Urban Affairs / DDWS",
    category: "sanitation",
  },
  electricity: {
    name: "Revamped Distribution Sector Scheme (RDSS)",
    ministry: "Ministry of Power",
    category: "electricity",
  },
  health: {
    name: "PM Ayushman Bharat Health Infrastructure Mission (PM-ABHIM)",
    ministry: "Ministry of Health & Family Welfare",
    category: "health",
  },
  education: {
    name: "Samagra Shiksha Abhiyan",
    ministry: "Ministry of Education",
    category: "education",
  },
};

const DEFAULT_ALIASES: Record<string, string[]> = {
  "mumbai suburban": ["mumbai", "mumbai suburban"],
  "bengaluru urban": ["bengaluru", "bangalore", "bengaluru urban"],
  "kamrup metropolitan": ["guwahati", "kamrup metropolitan", "kamrup metro"],
  "khordha": ["bhubaneswar", "khordha", "khurda"],
  "bastar": ["bastar", "jagdalpur"],
};

function parseNullableNumber(raw: string | undefined, opts?: { min?: number; max?: number }): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "na") return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;
  if (opts?.min !== undefined && num < opts.min) return null;
  if (opts?.max !== undefined && num > opts.max) return null;
  return num;
}

function parseNullableBoolean(raw: string | undefined): boolean | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim().toLowerCase();
  if (trimmed === "true" || trimmed === "1" || trimmed === "yes") return true;
  if (trimmed === "false" || trimmed === "0" || trimmed === "no") return false;
  return null;
}

/**
 * Parses a CSV string following the `data/districts.csv` schema into typed
 * `NationalDistrictRecord` objects. Comments (`# ...`) and blank lines are skipped.
 * Unverified or blank cells are returned as `null` — never fabricated.
 */
export function parseDistrictsCsv(csvText: string): NationalDistrictRecord[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (col: string) => header.indexOf(col);

  const stateIdx = idx("state");
  const distIdx = idx("district");
  const popIdx = idx("population_2011");
  const litIdx = idx("literacy_rate_2011");
  const aspIdx = idx("aspirational_district");
  const elecIdx = idx("nfhs5_electricity_pct");
  const waterIdx = idx("nfhs5_improved_water_pct") !== -1 ? idx("nfhs5_improved_water_pct") : idx("tap_water_coverage_pct");
  const sanIdx = idx("nfhs5_improved_sanitation_pct") !== -1 ? idx("nfhs5_improved_sanitation_pct") : idx("sanitation_coverage_pct");
  const roadIdx = idx("pmgsy_road_connectivity_pct");

  if (stateIdx === -1 || distIdx === -1) {
    throw new Error("Invalid district CSV header: 'state' and 'district' columns are required.");
  }

  const results: NationalDistrictRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const state = (cols[stateIdx] || "").trim();
    const district = (cols[distIdx] || "").trim();
    if (!state || !district) continue;

    const aliasKey = district.toLowerCase();
    const aliases = DEFAULT_ALIASES[aliasKey] || [district];

    const elecVal = elecIdx >= 0 ? parseNullableNumber(cols[elecIdx], { min: 0, max: 100 }) : null;
    const waterVal = waterIdx >= 0 ? parseNullableNumber(cols[waterIdx], { min: 0, max: 100 }) : null;
    const sanVal = sanIdx >= 0 ? parseNullableNumber(cols[sanIdx], { min: 0, max: 100 }) : null;
    const roadVal = roadIdx >= 0 ? parseNullableNumber(cols[roadIdx], { min: 0, max: 100 }) : null;

    results.push({
      state,
      district,
      aliases,
      population_2011: popIdx >= 0 ? parseNullableNumber(cols[popIdx], { min: 0 }) : null,
      literacy_rate_2011: litIdx >= 0 ? parseNullableNumber(cols[litIdx], { min: 0, max: 100 }) : null,
      aspirational_district: aspIdx >= 0 ? parseNullableBoolean(cols[aspIdx]) : null,
      nfhs5_electricity_pct: elecVal,
      nfhs5_improved_water_pct: waterVal,
      nfhs5_improved_sanitation_pct: sanVal,
      pmgsy_road_connectivity_pct: roadVal,
      tap_water_coverage_pct: waterVal,
      sanitation_coverage_pct: sanVal,
    });
  }

  return results;
}

/**
 * Returns the canonical national district dataset (safe for both Node.js and browser).
 */
export function getNationalDistricts(): NationalDistrictRecord[] {
  return (districtsJson as any[]).map((row) => ({
    state: row.state,
    district: row.district,
    aliases: row.aliases || DEFAULT_ALIASES[row.district?.toLowerCase()] || [row.district],
    population_2011: typeof row.population_2011 === "number" && row.population_2011 >= 0 ? row.population_2011 : null,
    literacy_rate_2011:
      typeof row.literacy_rate_2011 === "number" && row.literacy_rate_2011 >= 0 && row.literacy_rate_2011 <= 100
        ? row.literacy_rate_2011
        : null,
    aspirational_district: typeof row.aspirational_district === "boolean" ? row.aspirational_district : null,
    nfhs5_electricity_pct:
      typeof row.nfhs5_electricity_pct === "number" && row.nfhs5_electricity_pct >= 0 && row.nfhs5_electricity_pct <= 100
        ? row.nfhs5_electricity_pct
        : null,
    nfhs5_improved_water_pct:
      typeof row.nfhs5_improved_water_pct === "number" && row.nfhs5_improved_water_pct >= 0 && row.nfhs5_improved_water_pct <= 100
        ? row.nfhs5_improved_water_pct
        : null,
    nfhs5_improved_sanitation_pct:
      typeof row.nfhs5_improved_sanitation_pct === "number" && row.nfhs5_improved_sanitation_pct >= 0 && row.nfhs5_improved_sanitation_pct <= 100
        ? row.nfhs5_improved_sanitation_pct
        : null,
    pmgsy_road_connectivity_pct:
      typeof row.pmgsy_road_connectivity_pct === "number" && row.pmgsy_road_connectivity_pct >= 0 && row.pmgsy_road_connectivity_pct <= 100
        ? row.pmgsy_road_connectivity_pct
        : null,
    tap_water_coverage_pct:
      typeof row.nfhs5_improved_water_pct === "number"
        ? row.nfhs5_improved_water_pct
        : typeof row.tap_water_coverage_pct === "number"
          ? row.tap_water_coverage_pct
          : null,
    sanitation_coverage_pct:
      typeof row.nfhs5_improved_sanitation_pct === "number"
        ? row.nfhs5_improved_sanitation_pct
        : typeof row.sanitation_coverage_pct === "number"
          ? row.sanitation_coverage_pct
          : null,
  }));
}

function normalizePlaceName(name: string | undefined): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+district$/i, "")
    .replace(/\s+/g, " ");
}

/**
 * Finds a national district record by district name (or known city/district alias)
 * and optional state name. Returns `null` if the district is not in the dataset.
 */
export function findDistrictRecord(
  districtName: string,
  stateName?: string,
  dataset: NationalDistrictRecord[] = getNationalDistricts()
): NationalDistrictRecord | null {
  const cleanDistrict = normalizePlaceName(districtName);
  const cleanState = normalizePlaceName(stateName);
  if (!cleanDistrict) return null;

  const matches = dataset.filter((rec) => {
    const recDist = normalizePlaceName(rec.district);
    const aliasList = (rec.aliases || []).map((a) => normalizePlaceName(a));
    return recDist === cleanDistrict || aliasList.includes(cleanDistrict);
  });

  if (matches.length === 0) return null;
  if (matches.length === 1 || !cleanState) return matches[0];

  const stateMatch = matches.find((rec) => normalizePlaceName(rec.state) === cleanState);
  return stateMatch || matches[0];
}

/**
 * Returns the appropriate Government of India flagship scheme for a given
 * complaint category and country, or `null` if not applicable.
 */
export function getRelevantScheme(category: string, country = "India"): OfficialSchemeInfo | null {
  if (String(country || "India").trim().toLowerCase() !== "india") {
    return null;
  }
  const key = String(category || "").trim().toLowerCase();
  return OFFICIAL_INDIA_SCHEMES[key] || null;
}
