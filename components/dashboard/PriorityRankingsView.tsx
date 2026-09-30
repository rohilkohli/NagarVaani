'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Sparkles,
  AlertTriangle,
  Users,
  Clock,
  RotateCcw,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { PriorityRecommendation, Submission } from "@/lib/types";
import {
  joinAndScoreClusters,
  buildDeterministicRecommendations,
  PRIORITY_FORMULA_TOOLTIP,
  compareRawRank,
} from "@/lib/priority";
import { isDemoMode } from "@/lib/appMode";

const formatNeedScore = (val: number | undefined | null): string => {
  return val !== undefined && val !== null ? val.toFixed(3) : "N/A";
};

interface PriorityRankingsViewProps {
  submissions?: Submission[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  roads: {
    bg: "rgba(249, 115, 22, 0.12)",
    text: "#f97316",
    border: "rgba(249, 115, 22, 0.28)",
    glow: "rgba(249, 115, 22, 0.2)",
  },
  water: {
    bg: "rgba(56, 189, 248, 0.12)",
    text: "#38bdf8",
    border: "rgba(56, 189, 248, 0.28)",
    glow: "rgba(56, 189, 248, 0.2)",
  },
  electricity: {
    bg: "rgba(251, 191, 36, 0.12)",
    text: "#fbbf24",
    border: "rgba(251, 191, 36, 0.28)",
    glow: "rgba(251, 191, 36, 0.2)",
  },
  sanitation: {
    bg: "rgba(168, 85, 247, 0.12)",
    text: "#a855f7",
    border: "rgba(168, 85, 247, 0.28)",
    glow: "rgba(168, 85, 247, 0.2)",
  },
  health: {
    bg: "rgba(244, 63, 94, 0.12)",
    text: "#f43f5e",
    border: "rgba(244, 63, 94, 0.28)",
    glow: "rgba(244, 63, 94, 0.2)",
  },
  education: {
    bg: "rgba(52, 211, 153, 0.12)",
    text: "#34d399",
    border: "rgba(52, 211, 153, 0.28)",
    glow: "rgba(52, 211, 153, 0.2)",
  },
  other: {
    bg: "rgba(148, 163, 184, 0.12)",
    text: "#94a3b8",
    border: "rgba(148, 163, 184, 0.28)",
    glow: "rgba(148, 163, 184, 0.2)",
  },
};

export default function PriorityRankingsView({
  submissions = [],
  isLoading = false,
  onRefresh,
}: PriorityRankingsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [urgencyThreshold] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rank" | "raw_rank" | "urgency" | "population" | "reports">("rank");
  const [expandedRanks, setExpandedRanks] = useState<Set<number>>(new Set([1, 2]));
  const [copiedRank, setCopiedRank] = useState<number | null>(null);
  const [approvedDirectives, setApprovedDirectives] = useState<Set<number>>(new Set());
  const [apiRecommendations, setApiRecommendations] = useState<PriorityRecommendation[] | null>(null);
  const [engineMode, setEngineMode] = useState<"gemini" | "rule-based">("rule-based");
  const [fetchingApi, setFetchingApi] = useState<boolean>(false);

  // Deterministic national-data-joined baseline
  const localPrioritizedData = useMemo(() => {
    const joined = joinAndScoreClusters(submissions);
    return buildDeterministicRecommendations(joined);
  }, [submissions]);

  const fetchFromApi = useCallback(async () => {
    if (!submissions || submissions.length === 0) {
      setApiRecommendations(null);
      setEngineMode("rule-based");
      return;
    }
    setFetchingApi(true);
    try {
      const endpoint = isDemoMode() ? "/api/demo/prioritize" : "/api/prioritize";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(!isDemoMode() && typeof window !== "undefined" && sessionStorage.getItem("nv_dashboard_token")
            ? { Authorization: `Bearer ${sessionStorage.getItem("nv_dashboard_token")}` }
            : {}),
        },
        body: JSON.stringify({ submissions }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          setApiRecommendations(data.recommendations);
          setEngineMode(data.engine === "gemini" ? "gemini" : "rule-based");
          return;
        }
      }
      setApiRecommendations(null);
      setEngineMode("rule-based");
    } catch {
      setApiRecommendations(null);
      setEngineMode("rule-based");
    } finally {
      setFetchingApi(false);
    }
  }, [submissions]);

  useEffect(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  const prioritizedData = apiRecommendations && apiRecommendations.length > 0
    ? apiRecommendations
    : localPrioritizedData;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return prioritizedData
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesUrgency =
          urgencyThreshold === "all" ||
          (urgencyThreshold === "critical" && item.avg_urgency >= 4.0) ||
          (urgencyThreshold === "high" && item.avg_urgency >= 3.0 && item.avg_urgency < 4.0);
        const matchesSearch =
          searchQuery === "" ||
          item.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.state && item.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.ai_rationale.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.project_title && item.project_title.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesUrgency && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "raw_rank") return (a.raw_rank ?? a.rank) - (b.raw_rank ?? b.rank);
        if (sortBy === "urgency") return b.avg_urgency - a.avg_urgency;
        if (sortBy === "population") return (b.population_2011 ?? 0) - (a.population_2011 ?? 0);
        if (sortBy === "reports") return compareRawRank(a, b);
        return a.rank - b.rank;
      });
  }, [prioritizedData, selectedCategory, urgencyThreshold, searchQuery, sortBy]);

  // Top need node: computed from identical source array as the table
  const topNeedItem = useMemo(() => {
    if (!prioritizedData || prioritizedData.length === 0) return null;
    return [...prioritizedData].sort((a, b) => (b.need_weighted_score ?? 0) - (a.need_weighted_score ?? 0))[0];
  }, [prioritizedData]);

  // Check if multiple rows share equal raw complaint counts
  const hasEqualRawCounts = useMemo(() => {
    if (!prioritizedData || prioritizedData.length <= 1) return false;
    const seen = new Set<number>();
    for (const item of prioritizedData) {
      if (seen.has(item.count)) return true;
      seen.add(item.count);
    }
    return false;
  }, [prioritizedData]);

  // Aggregate metrics from verified Census 2011 figures (never fabricated multipliers)
  const totalCensusPopulationJoined = useMemo(() => {
    const seenDistricts = new Set<string>();
    let sum = 0;
    for (const item of prioritizedData) {
      const key = item.district.toLowerCase();
      if (!seenDistricts.has(key) && item.population_2011 !== null && item.population_2011 !== undefined) {
        seenDistricts.add(key);
        sum += item.population_2011;
      }
    }
    return sum;
  }, [prioritizedData]);

  const avgCriticality = useMemo(() => {
    if (!prioritizedData.length) return "0.0";
    const sum = prioritizedData.reduce((acc, curr) => acc + curr.avg_urgency, 0);
    return (sum / prioritizedData.length).toFixed(1);
  }, [prioritizedData]);

  const rankShiftedCount = useMemo(() => {
    return prioritizedData.filter((item) => (item.rank_delta ?? 0) !== 0).length;
  }, [prioritizedData]);

  const toggleExpand = (rank: number) => {
    setExpandedRanks((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const handleCopyDirective = (item: PriorityRecommendation) => {
    const text = `NAGARVAANI MUNICIPAL DIRECTIVE #${item.rank} (Raw Count Rank: #${item.raw_rank ?? item.rank})
Project Title: ${item.project_title || `${item.district} ${item.category} Intervention`}
Category: ${item.category.toUpperCase()}
Target District: ${item.district}, ${item.state}
Need-Weighted Score: ${item.need_weighted_score ?? "N/A"} (Complaints/100k: ${item.complaints_per_100k ?? "insufficient data"})
Urgency Index: ${item.avg_urgency}/5.0
Census 2011 District Population: ${item.population_2011 !== null && item.population_2011 !== undefined ? item.population_2011.toLocaleString() : "insufficient data"}
Relevant Scheme: ${item.relevant_scheme || "None (Municipal Budget)"}
Owning Department: ${item.owning_department || "District Administration"}
Evidence: ${item.evidence || item.ai_rationale}
Recommended Action: ${item.recommended_action}`;

    navigator.clipboard.writeText(text);
    setCopiedRank(item.rank);
    setTimeout(() => setCopiedRank(null), 2500);
  };

  const handleApproveDirective = (rank: number) => {
    setApprovedDirectives((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 select-none" id="ai-priorities-view">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND HEADER & STATS BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-subtle)] to-[var(--bg-elevated)] p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[rgba(99,102,241,0.15)] via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand-primary)]/30 text-[12px] font-semibold text-[var(--brand-secondary)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>National Data-Joined Priority Engine</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  engineMode === "gemini"
                    ? "bg-[rgba(16,185,129,0.12)] text-[var(--green)] border-[rgba(16,185,129,0.28)]"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {engineMode === "gemini" ? "gemini" : "rule-based"}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[11px] text-[var(--text-secondary)] cursor-help"
                title={PRIORITY_FORMULA_TOOLTIP}
                aria-label={PRIORITY_FORMULA_TOOLTIP}
              >
                <Info className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                <span>Need-Weighted Formula Tooltip</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Municipal & National Investment Priorities
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[var(--text-secondary)] leading-relaxed">
              Combines citizen grievance clusters with published <strong>Census 2011</strong> demographics, <strong>NFHS-5 (2019-21)</strong> district infrastructure indicators (electricity, improved water, improved sanitation), <strong>NITI Aayog Aspirational District</strong> flags, and national scheme mappings (JJM, PMGSY, SBM).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                fetchFromApi();
                onRefresh?.();
              }}
              disabled={isLoading || fetchingApi}
              className="h-9 px-3.5 rounded-[var(--radius-sm)] border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] text-[12px] font-medium text-[var(--text-primary)] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading || fetchingApi ? "animate-spin" : ""}`} />
              <span>Re-analyze Telemetry</span>
            </button>
            <a
              href="/data/SOURCES.md"
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] hover:border-[var(--brand-primary)] text-[12px] font-medium text-[var(--brand-secondary)] flex items-center gap-1.5"
            >
              <span>Data Sources</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 4 HIGH-IMPACT EXECUTIVE METRIC TILES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[var(--border-dim)]">
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)]/60 border border-[var(--border-dim)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--red)]" />
              <span>Top Need-Weighted Node</span>
            </div>
            <div className="text-[18px] sm:text-[20px] font-bold text-[var(--text-primary)] mt-1 truncate">
              {topNeedItem?.district || "N/A"}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 capitalize">
              {topNeedItem?.category} • Score {formatNeedScore(topNeedItem?.need_weighted_score)}
            </div>
          </div>

          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)]/60 border border-[var(--border-dim)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
              <Users className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
              <span>Census 2011 District Pop</span>
            </div>
            <div className="text-[18px] sm:text-[20px] font-bold text-[var(--text-primary)] mt-1 font-mono">
              {totalCensusPopulationJoined > 0
                ? `${(totalCensusPopulationJoined / 1000000).toFixed(2)}M`
                : "insufficient data"}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Census 2011 PCA coverage
            </div>
          </div>

          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)]/60 border border-[var(--border-dim)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
              <Flame className="w-3.5 h-3.5 text-[var(--amber)]" />
              <span>Mean Urgency</span>
            </div>
            <div className="text-[18px] sm:text-[20px] font-bold text-[var(--amber)] mt-1 font-mono">
              {avgCriticality} <span className="text-[13px] text-[var(--text-tertiary)] font-normal">/ 5.0</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Across {prioritizedData.length} priority clusters
            </div>
          </div>

          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)]/60 border border-[var(--border-dim)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--green)]" />
              <span>Priority Rank Shifts</span>
            </div>
            <div className="text-[18px] sm:text-[20px] font-bold text-[var(--green)] mt-1 font-mono">
              {rankShiftedCount} / {prioritizedData.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Re-ranked by per-capita need &amp; deprivation
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RAW COMPLAINT COUNT RANK VS NEED-WEIGHTED RANK COMPARISON VIEW         */}
      {/* ========================================================================= */}
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-[var(--radius-lg)] p-5 shadow-sm"
        id="raw-vs-need-weighted-comparison"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-dim)]">
          <div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[var(--brand-secondary)]" />
              <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
                Raw Complaint Count Rank vs Need-Weighted Rank
              </h2>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Demonstrates how joining Census 2011 population (complaints per 100k), literacy gap, and NITI Aayog Aspirational District flags re-orders priorities compared to raw complaint volume alone.
            </p>
            {hasEqualRawCounts && (
              <p className="text-[11px] text-[var(--text-tertiary)] italic mt-1">
                Equal counts are ranked by highest average urgency, then district name
              </p>
            )}
          </div>
          <div
            className="text-[11px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2.5 py-1.5 rounded border border-[var(--border-dim)] cursor-help shrink-0"
            title={PRIORITY_FORMULA_TOOLTIP}
          >
            score = (c/100k) × urgency × (1 + deprivation) × age
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border-dim)] text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
                <th className="py-2.5 pr-3">District &amp; Sector</th>
                <th className="py-2.5 px-3 text-right">Raw Complaints</th>
                <th className="py-2.5 px-3 text-center">Raw Rank</th>
                <th className="py-2.5 px-3 text-right">Census 2011 Pop</th>
                <th className="py-2.5 px-3 text-right">Per 100k</th>
                <th className="py-2.5 px-3 text-right">Deprivation</th>
                <th className="py-2.5 px-3 text-right">Need Score</th>
                <th className="py-2.5 px-3 text-center">Need Rank</th>
                <th className="py-2.5 pl-3 text-right">Rank Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-dim)]">
              {prioritizedData.map((item) => {
                const rawRank = item.raw_rank ?? item.rank;
                const delta = item.rank_delta ?? rawRank - item.rank;
                return (
                  <tr
                    key={`${item.district}-${item.category}`}
                    className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{item.district}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-dim)]">
                          {item.category}
                        </span>
                        {item.aspirational_district && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Aspirational
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">{item.state}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-primary)]">
                      {item.count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[var(--text-secondary)]">
                      #{rawRank}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                      {item.population_2011 !== null && item.population_2011 !== undefined
                        ? item.population_2011.toLocaleString()
                        : "insufficient data"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                      {item.complaints_per_100k !== null && item.complaints_per_100k !== undefined
                        ? item.complaints_per_100k.toFixed(3)
                        : "fallback"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                      +{((item.deprivation_factor ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-primary)]">
                      {formatNeedScore(item.need_weighted_score)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[var(--brand-secondary)]">
                      #{item.rank}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono font-semibold">
                      {delta > 0 ? (
                        <span className="text-[var(--green)]">▲ +{delta} spots</span>
                      ) : delta < 0 ? (
                        <span className="text-amber-400">▼ {delta} spots</span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">— 0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER CONTROLS & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`h-7 px-3 rounded-full text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[var(--brand-primary)] text-white shadow-xs"
                : "bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            All Sectors ({prioritizedData.length})
          </button>
          {["roads", "water", "electricity", "sanitation", "health", "education"].map((cat) => {
            const count = prioritizedData.filter((i) => i.category.toLowerCase() === cat).length;
            if (count === 0) return null;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-7 px-2.5 rounded-full text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap capitalize flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--brand-primary)] text-white shadow-xs"
                    : "bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search and Sort Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search district, scheme, issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
          >
            <option value="rank">Sort: Need-Weighted Rank</option>
            <option value="raw_rank">Sort: Raw Complaint Rank</option>
            <option value="urgency">Sort: Urgency (High to Low)</option>
            <option value="population">Sort: Census 2011 Population</option>
            <option value="reports">Sort: Raw Complaint Count</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PRIORITY DIRECTIVES DOSSIER LIST */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-dim)]">
            <ShieldAlert className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
            <h4 className="text-[15px] font-semibold text-[var(--text-primary)]">No matching priority items</h4>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Try adjusting your sector filter or search keyword.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedRanks.has(item.rank);
            const isApproved = approvedDirectives.has(item.rank);
            const isCopied = copiedRank === item.rank;
            const isTopRank = item.rank === 1;
            const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
            const rawRank = item.raw_rank ?? item.rank;
            const delta = item.rank_delta ?? rawRank - item.rank;

            return (
              <div
                key={item.rank}
                className={`relative overflow-hidden rounded-[var(--radius-lg)] transition-all duration-200 border ${
                  isTopRank
                    ? "bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-elevated)] border-[var(--brand-primary)]/40 shadow-lg shadow-[rgba(99,102,241,0.06)]"
                    : "bg-[var(--bg-surface)] border-[var(--border-dim)] hover:border-[var(--border-base)]"
                }`}
              >
                {isTopRank && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--amber)] to-[var(--brand-secondary)]" />
                )}

                {/* CARD SUMMARY HEADER ROW */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank Badge + Category + District & State */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-[var(--radius-md)] flex flex-col items-center justify-center shrink-0 font-mono font-bold shadow-xs ${
                        isTopRank
                          ? "bg-gradient-to-b from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white ring-2 ring-[var(--brand-primary)]/30"
                          : item.rank <= 3
                          ? "bg-[var(--bg-elevated)] text-[var(--brand-secondary)] border border-[var(--border-strong)]"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-dim)]"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-tighter opacity-80">Need</span>
                      <span className="text-[15px] leading-none">#{item.rank}</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          {item.category}
                        </span>

                        <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-primary)] tracking-tight truncate">
                          {item.project_title || `${item.district} — ${item.category}`}
                        </span>

                        {item.aspirational_district && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase">
                            NITI Aayog Aspirational District
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[12px] text-[var(--text-secondary)] flex-wrap">
                        <span>
                          {item.district}, {item.state}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[var(--text-primary)] font-semibold">
                          {item.count} complaints (Raw #{rawRank} → Need #{item.rank}
                          {delta > 0 ? ` ▲+${delta}` : delta < 0 ? ` ▼${delta}` : ""})
                        </span>
                        <span>•</span>
                        <span className="text-[var(--text-tertiary)] font-mono">
                          Census 2011 Pop:{" "}
                          {item.population_2011 !== null && item.population_2011 !== undefined
                            ? item.population_2011.toLocaleString()
                            : "insufficient data"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Need Score + Urgency Bar + Action CTA */}
                  <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--border-dim)]">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                          Need Score
                        </div>
                        <div className="text-[15px] font-mono font-bold text-[var(--brand-secondary)]">
                          {formatNeedScore(item.need_weighted_score)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                          Urgency
                        </div>
                        <div
                          className={`text-[15px] font-mono font-bold ${
                            item.avg_urgency >= 4.0
                              ? "text-[var(--red)]"
                              : item.avg_urgency >= 3.0
                              ? "text-[var(--amber)]"
                              : "text-[var(--green)]"
                          }`}
                        >
                          {item.avg_urgency.toFixed(1)} <span className="text-[11px] text-[var(--text-tertiary)] font-normal">/ 5</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(item.rank)}
                      className="h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? "Hide Dossier" : "View Dossier"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE INTELLIGENCE DOSSIER */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-2 bg-[var(--bg-subtle)] border-t border-[var(--border-dim)] space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Evidence, Rationale & Recommended Action (8 cols) */}
                      <div className="lg:col-span-8 space-y-3.5">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider text-[var(--brand-secondary)] mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Data-Joined Evidence &amp; Rationale ({item.engine || engineMode})</span>
                          </div>
                          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--border-dim)]">
                            {item.evidence || item.ai_rationale}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider text-[var(--green)] mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Prescribed Action Directive</span>
                          </div>
                          <div className="text-[13px] font-medium text-[var(--text-primary)] leading-relaxed bg-[rgba(34,197,94,0.06)] p-3 rounded-[var(--radius-md)] border border-[rgba(34,197,94,0.2)] flex items-start gap-2.5">
                            <Building2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                            <span>{item.recommended_action}</span>
                          </div>
                        </div>

                        {item.brics_parallel && (
                          <div className="text-[12px] text-[var(--text-tertiary)] italic flex items-start gap-2 pt-1">
                            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--brand-secondary)] shrink-0 mt-0.5" />
                            <span>{item.brics_parallel}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Key Decision Telemetry Box (4 cols) */}
                      <div className="lg:col-span-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                            Verified District Telemetry
                          </div>

                          <div className="flex items-center justify-between text-[12px] py-1 border-b border-[var(--border-dim)]">
                            <span className="text-[var(--text-secondary)]">Census 2011 Population</span>
                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                              {item.population_2011 !== null && item.population_2011 !== undefined
                                ? item.population_2011.toLocaleString()
                                : "insufficient data"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[12px] py-1 border-b border-[var(--border-dim)]">
                            <span className="text-[var(--text-secondary)]">Census 2011 Literacy</span>
                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                              {item.literacy_rate_2011 !== null && item.literacy_rate_2011 !== undefined
                                ? `${item.literacy_rate_2011}%`
                                : "insufficient data"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[12px] py-1 border-b border-[var(--border-dim)]">
                            <span className="text-[var(--text-secondary)]">Relevant Public Scheme</span>
                            <span className="font-semibold text-[var(--brand-secondary)] text-right">
                              {item.relevant_scheme || "None (Municipal)"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[12px] py-1 border-b border-[var(--border-dim)]">
                            <span className="text-[var(--text-secondary)]">Owning Department</span>
                            <span className="font-medium text-[var(--text-primary)] text-right">
                              {item.owning_department || "District Administration"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[12px] py-1">
                            <span className="text-[var(--text-secondary)]">Data Confidence</span>
                            <span className="font-mono font-semibold text-[var(--green)]">
                              {item.confidence || "insufficient_data"} ({item.engine || engineMode})
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyDirective(item)}
                            className="flex-1 h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[12px] font-medium text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[var(--green)]" />
                                <span className="text-[var(--green)]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                                <span>Copy Directive</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveDirective(item.rank)}
                            className={`flex-1 h-8 px-2.5 rounded-[var(--radius-sm)] text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              isApproved
                                ? "bg-[var(--green)] text-white shadow-xs"
                                : "bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white shadow-xs"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approved</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5" />
                                <span>Authorize Memo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
