import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  parseDistrictsCsv,
  getNationalDistricts,
  findDistrictRecord,
  getRelevantScheme,
} from "./nationalData.ts";
import {
  computeNeedWeightedScore,
  joinAndScoreClusters,
  buildDeterministicRecommendations,
  validateGeminiRecommendations,
  PRIORITY_WEIGHTS,
  PRIORITY_FORMULA_TOOLTIP,
} from "./priority.ts";

test("parseDistrictsCsv loads real published figures and preserves null for unverified columns", () => {
  const csvPath = path.resolve(process.cwd(), "data/districts.csv");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const parsed = parseDistrictsCsv(csvContent);

  assert.ok(parsed.length >= 20, "Should load at least 20 Indian districts");

  const ranchi = parsed.find((d) => d.district === "Ranchi");
  assert.ok(ranchi, "Ranchi must exist in districts.csv");
  assert.equal(ranchi.state, "Jharkhand");
  assert.equal(ranchi.population_2011, 2914253);
  assert.equal(ranchi.literacy_rate_2011, 76.06);
  assert.equal(ranchi.aspirational_district, true);
  // Unverified columns in Phase 2 states must remain strictly null (never fabricated)
  assert.equal(ranchi.nfhs5_electricity_pct, null);
  assert.equal(ranchi.nfhs5_improved_water_pct, null);
  assert.equal(ranchi.nfhs5_improved_sanitation_pct, null);
  assert.equal(ranchi.pmgsy_road_connectivity_pct, null);

  // Verified Phase 1 districts must contain real NFHS-5 values
  const patna = parsed.find((d) => d.district === "Patna");
  assert.ok(patna, "Patna must exist in districts.csv");
  assert.equal(patna.nfhs5_electricity_pct, 99.0);
  assert.equal(patna.nfhs5_improved_water_pct, 98.8);
  assert.equal(patna.nfhs5_improved_sanitation_pct, 61.0);

  // Verify JSON and CSV are in sync
  const jsonRecords = getNationalDistricts();
  assert.equal(parsed.length, jsonRecords.length);
});

test("parseDistrictsCsv handles comments, blank cells, inline numeric infra values, and SAMPLE file with ILLUSTRATIVE banner", () => {
  const samplePath = path.resolve(process.cwd(), "data/districts.SAMPLE.csv");
  const sampleText = fs.readFileSync(samplePath, "utf8");
  assert.ok(
    sampleText.includes("ILLUSTRATIVE SAMPLE"),
    "districts.SAMPLE.csv must have a visible ILLUSTRATIVE banner"
  );

  const sampleParsed = parseDistrictsCsv(sampleText);
  assert.ok(sampleParsed.length >= 10);
  const sampleRanchi = sampleParsed.find((d) => d.district === "Ranchi");
  assert.ok(sampleRanchi);
  assert.equal(sampleRanchi.population_2011, 2914253);
  assert.equal(sampleRanchi.nfhs5_electricity_pct, null);

  // Verify parser also parses numeric infrastructure columns when filled
  const filledCsv = [
    "# comment line",
    "state,district,population_2011,literacy_rate_2011,aspirational_district,nfhs5_electricity_pct,nfhs5_improved_water_pct,nfhs5_improved_sanitation_pct,pmgsy_road_connectivity_pct",
    "Odisha,Koraput,1379647,49.21,true,85.5,92.0,64.0,",
  ].join("\n");
  const filledParsed = parseDistrictsCsv(filledCsv);
  assert.equal(filledParsed.length, 1);
  assert.equal(filledParsed[0].nfhs5_electricity_pct, 85.5);
  assert.equal(filledParsed[0].nfhs5_improved_water_pct, 92.0);
  assert.equal(filledParsed[0].nfhs5_improved_sanitation_pct, 64.0);
  assert.equal(filledParsed[0].pmgsy_road_connectivity_pct, null);
});

test("findDistrictRecord resolves exact names and city/district aliases", () => {
  const mumbai = findDistrictRecord("Mumbai");
  assert.ok(mumbai);
  assert.equal(mumbai.district, "Mumbai Suburban");
  assert.equal(mumbai.population_2011, 9356962);

  const guwahati = findDistrictRecord("Guwahati", "Assam");
  assert.ok(guwahati);
  assert.equal(guwahati.district, "Kamrup Metropolitan");

  const unknown = findDistrictRecord("NonExistentDistrictXYZ");
  assert.equal(unknown, null);
});

test("computeNeedWeightedScore handles normal data, aspirational boost, missing data, and zero population edge cases", () => {
  assert.ok(PRIORITY_FORMULA_TOOLTIP.includes("Need-Weighted Score"));

  // Edge case 1: Zero complaints -> 0 score
  const zeroComplaints = computeNeedWeightedScore({
    complaintCount: 0,
    meanUrgency: 4.5,
    meanUnresolvedAgeDays: 10,
    districtRecord: findDistrictRecord("Patna"),
  });
  assert.equal(zeroComplaints.needWeightedScore, 0);
  assert.equal(zeroComplaints.complaintsPer100k, 0);

  // Edge case 2: Missing district record (null) -> uses fallback denominator & flags hasPopulationData=false
  const missingDistrict = computeNeedWeightedScore({
    complaintCount: 5,
    meanUrgency: 4.0,
    meanUnresolvedAgeDays: 0,
    districtRecord: null,
  });
  assert.equal(missingDistrict.hasPopulationData, false);
  assert.equal(missingDistrict.complaintsPer100k, null);
  assert.ok(missingDistrict.needWeightedScore > 0);

  // Edge case 3: Zero population in district record -> does not divide by zero
  const zeroPopDistrict = computeNeedWeightedScore({
    complaintCount: 5,
    meanUrgency: 4.0,
    meanUnresolvedAgeDays: 10,
    districtRecord: {
      state: "TestState",
      district: "ZeroPop",
      population_2011: 0,
      literacy_rate_2011: 70,
      aspirational_district: false,
      nfhs5_electricity_pct: null,
      nfhs5_improved_water_pct: null,
      nfhs5_improved_sanitation_pct: null,
      pmgsy_road_connectivity_pct: null,
    },
  });
  assert.equal(zeroPopDistrict.hasPopulationData, false);
  assert.equal(zeroPopDistrict.complaintsPer100k, null);
  assert.ok(Number.isFinite(zeroPopDistrict.needWeightedScore));

  // Normal vs Aspirational + Infra gap comparison (same population & complaints)
  const baseDistrict = {
    state: "StateA",
    district: "BaseDist",
    population_2011: 1_000_000,
    literacy_rate_2011: 85.0,
    aspirational_district: false,
    nfhs5_electricity_pct: 95.0,
    nfhs5_improved_water_pct: 90.0,
    nfhs5_improved_sanitation_pct: 88.0,
    pmgsy_road_connectivity_pct: null,
  };
  const deprivedDistrict = {
    state: "StateB",
    district: "DeprivedDist",
    population_2011: 1_000_000,
    literacy_rate_2011: 55.0,
    aspirational_district: true,
    nfhs5_electricity_pct: 60.0,
    nfhs5_improved_water_pct: 45.0,
    nfhs5_improved_sanitation_pct: 35.0,
    pmgsy_road_connectivity_pct: null,
  };

  const baseScore = computeNeedWeightedScore({
    complaintCount: 10,
    meanUrgency: 4,
    meanUnresolvedAgeDays: 5,
    districtRecord: baseDistrict,
  });
  const deprivedScore = computeNeedWeightedScore({
    complaintCount: 10,
    meanUrgency: 4,
    meanUnresolvedAgeDays: 5,
    districtRecord: deprivedDistrict,
  });

  assert.ok(
    deprivedScore.deprivationFactor > baseScore.deprivationFactor,
    "Aspirational district with lower literacy and infra coverage must have higher deprivation factor"
  );
  assert.ok(
    deprivedScore.needWeightedScore > baseScore.needWeightedScore,
    "Deprived district must receive a higher need-weighted priority score for equal complaint volume"
  );

  // Partial NFHS-5 indicator averaging: verify that deficit is averaged strictly over available values
  const partialDistrict = {
    state: "StateC",
    district: "PartialDist",
    population_2011: 1_000_000,
    literacy_rate_2011: 85.0,
    aspirational_district: false,
    nfhs5_electricity_pct: 90.0, // deficit = 0.10
    nfhs5_improved_water_pct: 70.0, // deficit = 0.30
    nfhs5_improved_sanitation_pct: null, // missing, should not dilute with 0
    pmgsy_road_connectivity_pct: null,
  };
  const partialScore = computeNeedWeightedScore({
    complaintCount: 10,
    meanUrgency: 4,
    meanUnresolvedAgeDays: 5,
    districtRecord: partialDistrict,
  });
  // Arithmetic by hand from documented formula in lib/priority.ts:
  // 1. Aspirational component: aspirational_district is false -> 0.0000
  // 2. Literacy deficit: (100 - 85.0) / 100 = 0.15
  //    Weighted literacy deprivation: PRIORITY_WEIGHTS.literacyGapWeight (0.25) * 0.15 = 0.0375
  // 3. Infrastructure indicators available: [90.0, 70.0] (2 of 3 indicators present)
  //    Electricity deficit = (100 - 90.0) / 100 = 0.10
  //    Water deficit       = (100 - 70.0) / 100 = 0.30
  //    Mean deficit over available indicators = (0.10 + 0.30) / 2 = 0.20
  //    Weighted infra deprivation: PRIORITY_WEIGHTS.infraGapWeight (0.40) * 0.20 = 0.0800
  // 4. Total Deprivation Factor = 0 + 0.0375 + 0.0800 = 0.1175
  // Note: The previous test expectation (0.0725) was wrong because it used incorrect weights
  // (0.15 instead of 0.25, and 0.25 instead of 0.40). The implementation in lib/priority.ts is correct.
  assert.equal(partialScore.hasInfraData, true);
  assert.ok(Math.abs(partialScore.deprivationFactor - 0.1175) < 0.001);
});

test("joinAndScoreClusters re-ranks smaller/aspirational districts above high-population metros (Raw vs Need rank)", () => {
  const now = Date.now();
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

  // Pune (pop 9.42M, non-aspirational) has 5 complaints (Raw Rank #1)
  // Ranchi (pop 2.91M, NITI Aayog Aspirational District) has 3 complaints (Raw Rank #2)
  const submissions = [
    { district: "Pune", state: "Maharashtra", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Pune", state: "Maharashtra", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Pune", state: "Maharashtra", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Pune", state: "Maharashtra", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Pune", state: "Maharashtra", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Ranchi", state: "Jharkhand", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Ranchi", state: "Jharkhand", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
    { district: "Ranchi", state: "Jharkhand", category: "water" as const, urgency: 4, created_at: fiveDaysAgo },
  ];

  const joined = joinAndScoreClusters(submissions, getNationalDistricts(), PRIORITY_WEIGHTS, now);
  assert.equal(joined.length, 2);

  // Need-weighted rank #1 should be Ranchi because of higher complaints/100k + Aspirational District deprivation factor
  const topNeed = joined[0];
  const secondNeed = joined[1];

  assert.equal(topNeed.district, "Ranchi");
  assert.equal(topNeed.need_rank, 1);
  assert.equal(topNeed.raw_rank, 2);
  assert.equal(topNeed.rank_delta, 1); // Moved up +1 spot compared to raw rank

  assert.equal(secondNeed.district, "Pune");
  assert.equal(secondNeed.need_rank, 2);
  assert.equal(secondNeed.raw_rank, 1);
  assert.equal(secondNeed.rank_delta, -1); // Moved down -1 spot compared to raw rank
});

test("buildDeterministicRecommendations and validateGeminiRecommendations enforce schema, real schemes, and insufficient_data", () => {
  const now = Date.now();
  const submissions = [
    { district: "Koraput", state: "Odisha", category: "water" as const, urgency: 5, created_at: new Date(now).toISOString() },
    { district: "UnknownTown", state: "UnknownState", category: "other" as const, urgency: 3, created_at: new Date(now).toISOString() },
  ];

  const joined = joinAndScoreClusters(submissions, getNationalDistricts(), PRIORITY_WEIGHTS, now);
  const deterministic = buildDeterministicRecommendations(joined);

  assert.equal(deterministic.length, 2);
  const koraputRec = deterministic.find((r) => r.district === "Koraput")!;
  assert.equal(koraputRec.engine, "rule-based");
  assert.ok(koraputRec.relevant_scheme?.includes("Jal Jeevan Mission"));
  assert.equal(koraputRec.population_2011, 1379647);
  assert.ok(koraputRec.estimated_beneficiaries !== null && koraputRec.estimated_beneficiaries > 0);

  const unknownRec = deterministic.find((r) => r.district === "UnknownTown")!;
  assert.equal(unknownRec.population_2011, null);
  assert.equal(unknownRec.estimated_beneficiaries, null);
  assert.equal(unknownRec.confidence, "insufficient_data");
  assert.equal(unknownRec.relevant_scheme, null);
  assert.ok(unknownRec.evidence?.includes("insufficient data"));

  // Validate Gemini payload: rejects malformed output
  assert.equal(validateGeminiRecommendations({ bad: true }, joined), null);
  assert.equal(validateGeminiRecommendations([], joined), null);

  // Validate Gemini payload: anchors numbers to ground truth and strips invented schemes on 'other' category
  const mockGeminiOutput = [
    {
      district: "Koraput",
      state: "Odisha",
      category: "water",
      project_title: "Koraput Rural Tap Water Augmentation",
      relevant_scheme: "Jal Jeevan Mission (JJM) / AMRUT 2.0",
      owning_department: "Water Supply & Jal Board",
      estimated_beneficiaries: 99999999, // Hallucinated number must be overridden by ground truth
      evidence: "1 complaint with urgency 5/5 in NITI Aayog Aspirational District Koraput (Census 2011 pop 1,379,647).",
      confidence: "medium",
      ai_rationale: "High per-capita urgency in aspirational district.",
      recommended_action: "Deploy JJM engineering team.",
    },
    {
      district: "UnknownTown",
      state: "UnknownState",
      category: "other",
      project_title: "UnknownTown Municipal Review",
      relevant_scheme: "Fake Hallucinated Scheme Yojana", // Must be stripped to null because category 'other' has no scheme
      owning_department: "Municipal Administration",
      estimated_beneficiaries: 50000, // Must be overridden to null because population_2011 is null
      evidence: "1 complaint, insufficient data for district population.",
      confidence: "high", // Must be overridden to insufficient_data because population_2011 is null
    },
  ];

  const validated = validateGeminiRecommendations(mockGeminiOutput, joined);
  assert.ok(validated);
  assert.equal(validated.length, 2);

  const vKoraput = validated.find((r) => r.district === "Koraput")!;
  assert.equal(vKoraput.engine, "gemini");
  assert.equal(vKoraput.estimated_beneficiaries, koraputRec.estimated_beneficiaries);

  const vUnknown = validated.find((r) => r.district === "UnknownTown")!;
  assert.equal(vUnknown.relevant_scheme, null);
  assert.equal(vUnknown.estimated_beneficiaries, null);
  assert.equal(vUnknown.confidence, "insufficient_data");

  // Direct scheme helper check
  assert.equal(getRelevantScheme("water", "India")?.name, "Jal Jeevan Mission (JJM) / AMRUT 2.0");
  assert.equal(getRelevantScheme("roads", "Brazil"), null);
  assert.equal(getRelevantScheme("other", "India"), null);
});
