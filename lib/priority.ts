import { PriorityRecommendation, Submission } from "./types";
import {
  NationalDistrictRecord,
  findDistrictRecord,
  getNationalDistricts,
  getRelevantScheme,
  OFFICIAL_INDIA_SCHEMES,
} from "./nationalData";
import { getDepartmentForCategory } from "./departments";

/**
 * ============================================================================
 * NEED-WEIGHTED PRIORITY SCORING FORMULA
 * ============================================================================
 *
 *   NeedWeightedScore =
 *     ComplaintsPer100k × MeanUrgency × (1 + DeprivationFactor) × UnresolvedAgeFactor
 *
 * Where:
 *   1. ComplaintsPer100k = (complaint_count / population_2011) × 100,000
 *      - If population_2011 is missing (null) or <= 0, falls back to
 *        `fallbackPopulationDenominator` (default 5,000,000) so the cluster can
 *        still be scored deterministically while flagging `hasPopulationData = false`
 *        and setting `confidence = "insufficient_data"`.
 *   2. MeanUrgency = arithmetic mean of complaint urgencies in [1.0, 5.0].
 *   3. DeprivationFactor =
 *        (aspirational_district ? aspirationalDistrictWeight : 0)
 *      + literacyGapWeight × ((100 - literacy_rate_2011) / 100)        [if literacy_rate_2011 != null]
 *      + infraGapWeight    × mean((100 - coverage_pct) / 100)          [over non-null infra indicators]
 *   4. UnresolvedAgeFactor =
 *        1 + unresolvedAgeWeightPerDay × min(mean_unresolved_age_days, maxAgeDaysCap)
 * ============================================================================
 */

export interface PriorityWeightsConfig {
  aspirationalDistrictWeight: number;
  literacyGapWeight: number;
  infraGapWeight: number;
  unresolvedAgeWeightPerDay: number;
  maxAgeDaysCap: number;
  fallbackPopulationDenominator: number;
  beneficiaryShareByCategory: Record<string, number>;
}

export const PRIORITY_WEIGHTS: PriorityWeightsConfig = {
  aspirationalDistrictWeight: 0.35,
  literacyGapWeight: 0.25,
  infraGapWeight: 0.40,
  unresolvedAgeWeightPerDay: 0.015,
  maxAgeDaysCap: 60,
  fallbackPopulationDenominator: 5_000_000,
  // Fraction of district population estimated to be served by a district-level
  // infrastructure intervention in each category (used ONLY when Census population exists)
  beneficiaryShareByCategory: {
    water: 0.04,
    roads: 0.035,
    electricity: 0.03,
    sanitation: 0.035,
    health: 0.05,
    education: 0.025,
    other: 0.02,
  },
};

export const PRIORITY_FORMULA_TOOLTIP =
  "Need-Weighted Score = (Complaints per 100k Pop) × Mean Urgency × (1 + Deprivation Factor) × Unresolved-Age Factor. " +
  "Deprivation Factor combines NITI Aayog Aspirational District status (+0.35), Census 2011 literacy deficit (×0.25), " +
  "and verified infrastructure coverage gaps (×0.40). Unresolved-Age Factor adds +1.5% per day unresolved (capped at 60 days).";

export interface ScoreCalculationInput {
  complaintCount: number;
  meanUrgency: number;
  meanUnresolvedAgeDays: number;
  districtRecord: NationalDistrictRecord | null;
}

export interface ScoreCalculationResult {
  needWeightedScore: number;
  complaintsPer100k: number | null;
  effectiveComplaintsPer100k: number;
  meanUrgency: number;
  deprivationFactor: number;
  unresolvedAgeFactor: number;
  hasPopulationData: boolean;
  hasInfraData: boolean;
}

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

/**
 * Computes the need-weighted priority score and its intermediate factors.
 * Handles edge cases safely: zero complaints, null district record, zero/negative population,
 * and null infrastructure coverage indicators.
 */
export function computeNeedWeightedScore(
  input: ScoreCalculationInput,
  weights: PriorityWeightsConfig = PRIORITY_WEIGHTS
): ScoreCalculationResult {
  const count = Math.max(0, Number(input.complaintCount) || 0);
  if (count === 0) {
    return {
      needWeightedScore: 0,
      complaintsPer100k: 0,
      effectiveComplaintsPer100k: 0,
      meanUrgency: 0,
      deprivationFactor: 0,
      unresolvedAgeFactor: 1,
      hasPopulationData: Boolean(
        input.districtRecord?.population_2011 && input.districtRecord.population_2011 > 0
      ),
      hasInfraData: false,
    };
  }

  const meanUrgency = clamp(Number(input.meanUrgency) || 3, 1, 5);
  const rec = input.districtRecord;

  const validPop =
    rec && typeof rec.population_2011 === "number" && Number.isFinite(rec.population_2011) && rec.population_2011 > 0
      ? rec.population_2011
      : null;

  const hasPopulationData = validPop !== null;
  const complaintsPer100k = validPop !== null ? (count / validPop) * 100_000 : null;
  const effectiveComplaintsPer100k =
    complaintsPer100k !== null
      ? complaintsPer100k
      : (count / Math.max(1, weights.fallbackPopulationDenominator)) * 100_000;

  // Deprivation factor components
  let deprivation = 0;
  if (rec?.aspirational_district === true) {
    deprivation += weights.aspirationalDistrictWeight;
  }

  if (rec && typeof rec.literacy_rate_2011 === "number" && Number.isFinite(rec.literacy_rate_2011)) {
    const litClamped = clamp(rec.literacy_rate_2011, 0, 100);
    const literacyDeficit = (100 - litClamped) / 100;
    deprivation += weights.literacyGapWeight * literacyDeficit;
  }

  const infraValues = [
    rec?.tap_water_coverage_pct,
    rec?.pmgsy_road_connectivity_pct,
    rec?.sanitation_coverage_pct,
  ].filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const hasInfraData = infraValues.length > 0;
  if (hasInfraData) {
    const meanInfraDeficit =
      infraValues.reduce((acc, pct) => acc + (100 - clamp(pct, 0, 100)) / 100, 0) / infraValues.length;
    deprivation += weights.infraGapWeight * meanInfraDeficit;
  }

  const clampedAgeDays = clamp(Number(input.meanUnresolvedAgeDays) || 0, 0, weights.maxAgeDaysCap);
  const unresolvedAgeFactor = 1 + weights.unresolvedAgeWeightPerDay * clampedAgeDays;

  const rawScore = effectiveComplaintsPer100k * meanUrgency * (1 + deprivation) * unresolvedAgeFactor;

  return {
    needWeightedScore: Number(rawScore.toFixed(4)),
    complaintsPer100k: complaintsPer100k !== null ? Number(complaintsPer100k.toFixed(4)) : null,
    effectiveComplaintsPer100k: Number(effectiveComplaintsPer100k.toFixed(4)),
    meanUrgency: Number(meanUrgency.toFixed(2)),
    deprivationFactor: Number(deprivation.toFixed(4)),
    unresolvedAgeFactor: Number(unresolvedAgeFactor.toFixed(4)),
    hasPopulationData,
    hasInfraData,
  };
}

export interface JoinedPriorityCluster {
  key: string;
  district: string;
  state: string;
  country: string;
  category: string;
  count: number;
  avg_urgency: number;
  total_upvotes: number;
  mean_unresolved_age_days: number;
  population_2011: number | null;
  literacy_rate_2011: number | null;
  aspirational_district: boolean | null;
  tap_water_coverage_pct: number | null;
  pmgsy_road_connectivity_pct: number | null;
  sanitation_coverage_pct: number | null;
  complaints_per_100k: number | null;
  deprivation_factor: number;
  unresolved_age_factor: number;
  need_weighted_score: number;
  raw_rank: number;
  need_rank: number;
  rank_delta: number;
  relevant_scheme: string | null;
  owning_department: string;
  estimated_beneficiaries: number | null;
  confidence: "high" | "medium" | "low" | "insufficient_data";
  evidence: string;
}

export interface ClusterableSubmissionInput {
  district?: string;
  state?: string;
  country?: string;
  category?: string;
  urgency?: number;
  upvotes?: number;
  status?: string;
  created_at?: string | Date;
}

/**
 * Aggregates citizen complaints by `(district, category)`, joins each cluster with
 * `NationalDistrictRecord` demographic & infrastructure indicators, and computes both
 * `raw_rank` (by raw complaint count) and `need_rank` (by need-weighted score).
 */
export function joinAndScoreClusters(
  submissions: Array<ClusterableSubmissionInput | Partial<Submission>>,
  dataset: NationalDistrictRecord[] = getNationalDistricts(),
  weights: PriorityWeightsConfig = PRIORITY_WEIGHTS,
  nowMs: number = Date.now()
): JoinedPriorityCluster[] {
  const groups = new Map<
    string,
    {
      district: string;
      state: string;
      country: string;
      category: string;
      count: number;
      urgencies: number[];
      upvotes: number;
      unresolvedAgesDays: number[];
    }
  >();

  for (const sub of submissions) {
    if (!sub || sub.status === "duplicate") continue;
    const district = String(sub.district || "Unknown").trim() || "Unknown";
    const state = String(sub.state || "").trim();
    const country = String(sub.country || "India").trim() || "India";
    const category = String(sub.category || "other").trim().toLowerCase() || "other";
    const key = `${country.toLowerCase()}__${district.toLowerCase()}__${category}`;

    if (!groups.has(key)) {
      groups.set(key, {
        district,
        state,
        country,
        category,
        count: 0,
        urgencies: [],
        upvotes: 0,
        unresolvedAgesDays: [],
      });
    }

    const g = groups.get(key)!;
    g.count += 1;
    g.urgencies.push(clamp(Number(sub.urgency) || 3, 1, 5));
    g.upvotes += Math.max(0, Number(sub.upvotes) || 0);
    if (!g.state && state) g.state = state;

    if (sub.status !== "resolved") {
      const createdTime = sub.created_at ? new Date(sub.created_at as any).getTime() : NaN;
      const ageDays = Number.isFinite(createdTime)
        ? Math.max(0, (nowMs - createdTime) / (1000 * 60 * 60 * 24))
        : 0;
      g.unresolvedAgesDays.push(ageDays);
    }
  }

  const intermediate = Array.from(groups.entries()).map(([key, g]) => {
    const meanUrgency = g.urgencies.reduce((a, b) => a + b, 0) / (g.urgencies.length || 1);
    const meanUnresolvedAgeDays =
      g.unresolvedAgesDays.length > 0
        ? g.unresolvedAgesDays.reduce((a, b) => a + b, 0) / g.unresolvedAgesDays.length
        : 0;

    const districtRecord =
      g.country.toLowerCase() === "india" ? findDistrictRecord(g.district, g.state, dataset) : null;

    const resolvedState = g.state || districtRecord?.state || "";
    const score = computeNeedWeightedScore(
      {
        complaintCount: g.count,
        meanUrgency,
        meanUnresolvedAgeDays,
        districtRecord,
      },
      weights
    );

    const schemeInfo = getRelevantScheme(g.category, g.country);
    const dept = getDepartmentForCategory(g.category);

    // Derive estimated beneficiaries strictly from verified Census population when available
    const pop = districtRecord?.population_2011 ?? null;
    const share = weights.beneficiaryShareByCategory[g.category] ?? 0.02;
    const urgencyScale = 0.6 + (score.meanUrgency / 5) * 0.4;
    const estimatedBeneficiaries =
      pop !== null && pop > 0 ? Math.round(pop * share * urgencyScale) : null;

    // Confidence level reflects data completeness
    let confidence: "high" | "medium" | "low" | "insufficient_data";
    if (!score.hasPopulationData) {
      confidence = "insufficient_data";
    } else if (score.hasInfraData && g.count >= 2) {
      confidence = "high";
    } else if (score.hasPopulationData) {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    // Build transparent, verifiable evidence string citing exact numbers or "insufficient data"
    const popPart =
      pop !== null
        ? `Census 2011 pop ${pop.toLocaleString("en-IN")} (${score.complaintsPer100k?.toFixed(2)} complaints/100k)`
        : "population: insufficient data (unmatched district)";
    const litPart =
      districtRecord?.literacy_rate_2011 != null
        ? `literacy ${districtRecord.literacy_rate_2011.toFixed(2)}%`
        : "literacy: insufficient data";
    const aspPart =
      districtRecord?.aspirational_district != null
        ? districtRecord.aspirational_district
          ? "NITI Aayog Aspirational District: Yes (+0.35 deprivation weight)"
          : "NITI Aayog Aspirational District: No"
        : "aspirational status: insufficient data";
    const infraParts: string[] = [];
    if (districtRecord?.tap_water_coverage_pct != null) {
      infraParts.push(`JJM tap water ${districtRecord.tap_water_coverage_pct}%`);
    }
    if (districtRecord?.pmgsy_road_connectivity_pct != null) {
      infraParts.push(`PMGSY roads ${districtRecord.pmgsy_road_connectivity_pct}%`);
    }
    if (districtRecord?.sanitation_coverage_pct != null) {
      infraParts.push(`sanitation ${districtRecord.sanitation_coverage_pct}%`);
    }
    const infraSummary =
      infraParts.length > 0 ? infraParts.join(", ") : "district infra coverage: insufficient data (null in CSV)";

    const evidence = `${g.count} complaint(s), mean urgency ${score.meanUrgency}/5, mean unresolved age ${meanUnresolvedAgeDays.toFixed(1)}d; ${popPart}; ${litPart}; ${aspPart}; ${infraSummary}.`;

    return {
      key,
      district: g.district,
      state: resolvedState,
      country: g.country,
      category: g.category,
      count: g.count,
      avg_urgency: score.meanUrgency,
      total_upvotes: g.upvotes,
      mean_unresolved_age_days: Number(meanUnresolvedAgeDays.toFixed(1)),
      population_2011: pop,
      literacy_rate_2011: districtRecord?.literacy_rate_2011 ?? null,
      aspirational_district: districtRecord?.aspirational_district ?? null,
      tap_water_coverage_pct: districtRecord?.tap_water_coverage_pct ?? null,
      pmgsy_road_connectivity_pct: districtRecord?.pmgsy_road_connectivity_pct ?? null,
      sanitation_coverage_pct: districtRecord?.sanitation_coverage_pct ?? null,
      complaints_per_100k: score.complaintsPer100k,
      deprivation_factor: score.deprivationFactor,
      unresolved_age_factor: score.unresolvedAgeFactor,
      need_weighted_score: score.needWeightedScore,
      raw_rank: 0,
      need_rank: 0,
      rank_delta: 0,
      relevant_scheme: schemeInfo ? schemeInfo.name : null,
      owning_department: dept.name,
      estimated_beneficiaries: estimatedBeneficiaries,
      confidence,
      evidence,
    };
  });

  // 1. Assign raw_rank (sorted by raw complaint count desc, then avg_urgency desc, then district asc)
  const byRaw = [...intermediate].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.avg_urgency !== a.avg_urgency) return b.avg_urgency - a.avg_urgency;
    return a.district.localeCompare(b.district);
  });
  byRaw.forEach((item, idx) => {
    item.raw_rank = idx + 1;
  });

  // 2. Assign need_rank (sorted by need_weighted_score desc, then count desc, then district asc)
  const byNeed = [...intermediate].sort((a, b) => {
    if (b.need_weighted_score !== a.need_weighted_score) {
      return b.need_weighted_score - a.need_weighted_score;
    }
    if (b.count !== a.count) return b.count - a.count;
    return a.district.localeCompare(b.district);
  });
  byNeed.forEach((item, idx) => {
    item.need_rank = idx + 1;
    item.rank_delta = item.raw_rank - item.need_rank;
  });

  return byNeed;
}

const PROJECT_TITLES_BY_CATEGORY: Record<string, (district: string) => string> = {
  water: (d) => `${d} Piped Water Supply & Pipeline Rehabilitation Project`,
  roads: (d) => `${d} All-Weather Arterial & Link Road Restoration Project`,
  electricity: (d) => `${d} Distribution Transformer & Feeder Reliability Upgrade`,
  sanitation: (d) => `${d} Storm-Drainage Desilting & Solid Waste Management Project`,
  health: (d) => `${d} Primary & Community Health Facility Strengthening Project`,
  education: (d) => `${d} Government School Infrastructure & Classroom Renewal Project`,
  other: (d) => `${d} Municipal Civic Infrastructure Remediation Project`,
};

/**
 * Deterministic ("rule-based") recommendation builder over joined clusters.
 * Never fabricates missing numbers; explicitly labels `"insufficient data"` when
 * district demographic records are unavailable.
 */
export function buildDeterministicRecommendations(
  clusters: JoinedPriorityCluster[],
  limit = 10
): PriorityRecommendation[] {
  return clusters.slice(0, limit).map((c, idx) => {
    const titleBuilder = PROJECT_TITLES_BY_CATEGORY[c.category] || PROJECT_TITLES_BY_CATEGORY.other;
    const projectTitle = titleBuilder(c.district);
    const schemeNote = c.relevant_scheme
      ? `Aligns with ${c.relevant_scheme} under ${c.owning_department}.`
      : `Routed to ${c.owning_department} (no specific central scheme mapped for category '${c.category}').`;

    const rationale =
      c.population_2011 !== null
        ? `${c.district}${c.state ? ` (${c.state})` : ""} ranks #${idx + 1} by need-weighted score (${c.need_weighted_score.toFixed(2)}) vs #${c.raw_rank} by raw complaint volume. ${c.evidence} ${schemeNote}`
        : `${c.district}${c.state ? ` (${c.state})` : ""} has ${c.count} complaint(s) with mean urgency ${c.avg_urgency}/5, but Census 2011 demographic data is insufficient data for this district. ${schemeNote}`;

    const action = c.relevant_scheme
      ? `Submit Detailed Project Report (DPR) through ${c.owning_department} for convergence funding under ${c.relevant_scheme}.`
      : `Assign field verification and capital repair work order to ${c.owning_department}.`;

    return {
      rank: idx + 1,
      raw_rank: c.raw_rank,
      rank_delta: c.raw_rank - (idx + 1),
      need_weighted_score: c.need_weighted_score,
      complaints_per_100k: c.complaints_per_100k,
      deprivation_factor: c.deprivation_factor,
      unresolved_age_factor: c.unresolved_age_factor,
      project_title: projectTitle,
      category: c.category,
      district: c.district,
      state: c.state,
      country: c.country,
      count: c.count,
      avg_urgency: c.avg_urgency,
      population_2011: c.population_2011,
      literacy_rate_2011: c.literacy_rate_2011,
      aspirational_district: c.aspirational_district,
      relevant_scheme: c.relevant_scheme,
      owning_department: c.owning_department,
      estimated_beneficiaries: c.estimated_beneficiaries,
      estimated_population_affected: c.estimated_beneficiaries ?? 0,
      evidence: c.evidence,
      confidence: c.confidence,
      engine: "rule-based",
      ai_rationale: rationale,
      recommended_action: action,
    };
  });
}

const VALID_CONFIDENCES = new Set(["high", "medium", "low", "insufficient_data"]);
const KNOWN_SCHEME_NAMES = new Set(Object.values(OFFICIAL_INDIA_SCHEMES).map((s) => s.name.toLowerCase()));

/**
 * Validates Gemini's structured JSON array output against the joined clusters.
 * Anchors all numeric/demographic fields (`population_2011`, `need_weighted_score`,
 * `estimated_beneficiaries`, `raw_rank`, `rank_delta`) to ground-truth values from
 * `joinedClusters` so Gemini cannot hallucinate statistics.
 * Returns `null` if the response is malformed or empty so the caller can fall back
 * to `buildDeterministicRecommendations`.
 */
export function validateGeminiRecommendations(
  rawParsed: unknown,
  joinedClusters: JoinedPriorityCluster[],
  limit = 10
): PriorityRecommendation[] | null {
  if (!Array.isArray(rawParsed) || rawParsed.length === 0 || joinedClusters.length === 0) {
    return null;
  }

  const targetClusters = joinedClusters.slice(0, limit);
  const validated: PriorityRecommendation[] = [];

  for (let i = 0; i < targetClusters.length; i++) {
    const cluster = targetClusters[i];
    // Match by (district, category) or positional index
    const candidate: any =
      rawParsed.find(
        (item: any) =>
          item &&
          typeof item === "object" &&
          String(item.district || "").toLowerCase() === cluster.district.toLowerCase() &&
          String(item.category || "").toLowerCase() === cluster.category.toLowerCase()
      ) || rawParsed[i];

    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    const projectTitle = String(candidate.project_title || "").trim();
    const evidence = String(candidate.evidence || candidate.ai_rationale || "").trim();
    const owningDept = String(candidate.owning_department || cluster.owning_department).trim();

    if (!projectTitle || !evidence || !owningDept) {
      return null;
    }

    // Only allow a real scheme when appropriate (ground-truth scheme or null)
    let relevantScheme: string | null = cluster.relevant_scheme;
    if (candidate.relevant_scheme === null || candidate.relevant_scheme === "insufficient data") {
      relevantScheme = cluster.relevant_scheme;
    } else if (typeof candidate.relevant_scheme === "string" && candidate.relevant_scheme.trim()) {
      const candLower = candidate.relevant_scheme.trim().toLowerCase();
      // Reject invented schemes if the category has no scheme or country !== India
      if (cluster.relevant_scheme === null) {
        relevantScheme = null;
      } else if (KNOWN_SCHEME_NAMES.has(candLower) || candLower.includes("jal jeevan") || candLower.includes("pmgsy") || candLower.includes("swachh bharat") || candLower.includes("rdss") || candLower.includes("ayushman") || candLower.includes("samagra shiksha")) {
        relevantScheme = candidate.relevant_scheme.trim();
      }
    }

    const rawConf = String(candidate.confidence || "").trim().toLowerCase();
    const confidence: PriorityRecommendation["confidence"] =
      cluster.population_2011 === null
        ? "insufficient_data"
        : VALID_CONFIDENCES.has(rawConf)
        ? (rawConf as PriorityRecommendation["confidence"])
        : cluster.confidence;

    validated.push({
      rank: i + 1,
      raw_rank: cluster.raw_rank,
      rank_delta: cluster.raw_rank - (i + 1),
      need_weighted_score: cluster.need_weighted_score,
      complaints_per_100k: cluster.complaints_per_100k,
      deprivation_factor: cluster.deprivation_factor,
      unresolved_age_factor: cluster.unresolved_age_factor,
      project_title: projectTitle,
      category: cluster.category,
      district: cluster.district,
      state: cluster.state,
      country: cluster.country,
      count: cluster.count,
      avg_urgency: cluster.avg_urgency,
      population_2011: cluster.population_2011,
      literacy_rate_2011: cluster.literacy_rate_2011,
      aspirational_district: cluster.aspirational_district,
      relevant_scheme: relevantScheme,
      owning_department: owningDept,
      estimated_beneficiaries: cluster.estimated_beneficiaries,
      estimated_population_affected: cluster.estimated_beneficiaries ?? 0,
      evidence: cluster.population_2011 === null && !evidence.toLowerCase().includes("insufficient data")
        ? `${evidence} (Note: Census 2011 population is insufficient data for ${cluster.district}).`
        : evidence,
      confidence,
      engine: "gemini",
      ai_rationale: String(candidate.ai_rationale || evidence).trim(),
      recommended_action: String(
        candidate.recommended_action ||
          (relevantScheme
            ? `Coordinate ${owningDept} implementation under ${relevantScheme}.`
            : `Dispatch ${owningDept} field engineering team.`)
      ).trim(),
    });
  }

  return validated;
}
