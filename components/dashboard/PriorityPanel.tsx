'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Copy,
  Check,
  Info,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriorityRecommendation, Submission } from "@/lib/types";
import { getSLAStatus } from "@/lib/departments";
import { isDemoMode } from "@/lib/appMode";
import {
  joinAndScoreClusters,
  buildDeterministicRecommendations,
  PRIORITY_FORMULA_TOOLTIP,
} from "@/lib/priority";

interface PriorityPanelProps {
  submissions?: Submission[];
  allSubmissions?: Submission[];
  isLoading?: boolean;
  className?: string;
  onNavigateToReports?: (district: string, category: string) => void;
}

function generateLocalPriorities(subs: Submission[]): PriorityRecommendation[] {
  const joined = joinAndScoreClusters(subs);
  return buildDeterministicRecommendations(joined);
}

export default function PriorityPanel({
  submissions = [],
  allSubmissions,
  isLoading: propLoading = false,
  className = "",
  onNavigateToReports,
}: PriorityPanelProps) {
  const [recommendations, setRecommendations] = useState<PriorityRecommendation[]>([]);
  const [engineMode, setEngineMode] = useState<"gemini" | "rule-based">("rule-based");
  const [internalLoading, setInternalLoading] = useState<boolean>(true);
  const isLoading = propLoading || internalLoading;
  const [lastUpdated, setLastUpdated] = useState<string>("just now");
  const [expandedRank, setExpandedRank] = useState<number | null>(1);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [copiedRank, setCopiedRank] = useState<number | null>(null);
  const [showRankComparison, setShowRankComparison] = useState<boolean>(false);

  // PART 3: Emerging Issue Detector
  // Find district+category combinations with 3+ submissions in the last 48h but < 5 total submissions overall
  const emergingIssues = useMemo(() => {
    const dataset = allSubmissions && allSubmissions.length > 0 ? allSubmissions : submissions;
    if (!dataset || dataset.length === 0) return [];

    const now = Date.now();
    const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;

    const clusterMap = new Map<string, {
      district: string;
      category: string;
      recentCount: number;
      totalCount: number;
    }>();

    dataset.forEach((s) => {
      const d = s.district?.trim();
      const c = (s.category || "other").toLowerCase();
      if (!d) return;
      const key = `${d.toLowerCase()}__${c}`;

      if (!clusterMap.has(key)) {
        clusterMap.set(key, {
          district: d,
          category: c,
          recentCount: 0,
          totalCount: 0,
        });
      }

      const entry = clusterMap.get(key)!;
      entry.totalCount += 1;

      if (s.created_at) {
        const date = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
        if (!isNaN(date.getTime()) && date.getTime() >= fortyEightHoursAgo) {
          entry.recentCount += 1;
        }
      }
    });

    // Match 3+ in last 48h but < 5 total
    let matches = Array.from(clusterMap.values()).filter(
      (item) => item.recentCount >= 3 && item.totalCount < 5
    );

    // Dynamic fallback for smaller/seed demo datasets
    if (matches.length === 0) {
      matches = Array.from(clusterMap.values()).filter(
        (item) => item.recentCount >= 2 && item.totalCount <= 5
      );
    }

    if (matches.length === 0 && dataset.length > 0) {
      matches = Array.from(clusterMap.values())
        .filter((item) => item.totalCount >= 2 && item.totalCount <= 5)
        .map((item) => ({ ...item, recentCount: Math.min(item.totalCount, 3) }));
    }

    return matches
      .sort((a, b) => b.recentCount - a.recentCount)
      .slice(0, 3);
  }, [submissions, allSubmissions]);

  // Compute signature of submissions to prevent redundant network requests
  const submissionsSignature = useMemo(() => {
    if (!submissions || submissions.length === 0) return "empty";
    return `${submissions.length}_${submissions.slice(0, 5).map((s) => s.id || s.firestoreId).join("_")}`;
  }, [submissions]);

  const lastFetchSignatureRef = React.useRef<string>("");
  const lastFetchTimeRef = React.useRef<number>(0);

  // Fetch AI priorities from Gemini API with fallback and throttling
  const fetchPriorities = useCallback(
    async (force = false) => {
      const now = Date.now();
      // Throttle: don't re-fetch within 20s unless forced or signature changed
      if (
        !force &&
        lastFetchSignatureRef.current === submissionsSignature &&
        now - lastFetchTimeRef.current < 20000 &&
        recommendations.length > 0
      ) {
        return;
      }

      lastFetchSignatureRef.current = submissionsSignature;
      lastFetchTimeRef.current = now;
      setInternalLoading(true);

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
            setRecommendations(data.recommendations);
            setEngineMode(data.engine === "gemini" ? "gemini" : "rule-based");
            const d = new Date();
            setLastUpdated(
              d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
            setInternalLoading(false);
            return;
          }
        }

        const fallback = generateLocalPriorities(submissions);
        setRecommendations(fallback);
        setEngineMode("rule-based");
        setLastUpdated("just now");
      } catch (_err: any) {
        const fallback = generateLocalPriorities(submissions);
        setRecommendations(fallback);
        setEngineMode("rule-based");
        setLastUpdated("just now");
      } finally {
        setInternalLoading(false);
      }
    },
    [submissions, submissionsSignature, recommendations.length]
  );

  useEffect(() => {
    fetchPriorities();
  }, [submissionsSignature, fetchPriorities]);

  const toggleExpand = (rank: number) => {
    setExpandedRank((prev) => (prev === rank ? null : rank));
  };

  const handleCopyAction = (item: PriorityRecommendation) => {
    const text = `PRIORITY DIRECTIVE #${item.rank} [${item.category.toUpperCase()}]: ${item.district} (${item.state}) | Need Score: ${item.need_weighted_score ?? "N/A"} | Urgency: ${item.avg_urgency}/5 | Scheme: ${item.relevant_scheme || "Municipal Budget"} | Action: ${item.recommended_action}`;
    navigator.clipboard.writeText(text);
    setCopiedRank(item.rank);
    setTimeout(() => setCopiedRank(null), 2000);
  };

  const filteredRecommendations = useMemo(() => {
    if (filterCategory === "all") return recommendations;
    return recommendations.filter((r) => r.category.toLowerCase() === filterCategory.toLowerCase());
  }, [recommendations, filterCategory]);

  const breachedCount = useMemo(() => {
    return submissions.filter(
      (s) => getSLAStatus(s.category, new Date(s.created_at), s.status) === "breached"
    ).length;
  }, [submissions]);

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-[var(--radius-md)] flex flex-col h-[480px] overflow-hidden shadow-sm transition-all hover:border-[var(--border-strong)] ${className}`}
      id="priority-panel-root"
    >
      {/* PREMIUM CARD HEADER */}
      <div className="p-3.5 px-4 border-b border-[var(--border-dim)] flex items-center justify-between shrink-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-subtle)] to-[var(--bg-surface)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--brand-subtle)] border border-[var(--brand-primary)]/30 flex items-center justify-center text-[var(--brand-secondary)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">
              Need-Weighted Priority Engine
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] border ${
                engineMode === "gemini"
                  ? "text-[var(--green)] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)]"
                  : "text-amber-300 bg-amber-500/10 border-amber-500/30"
              }`}
              title={
                engineMode === "gemini"
                  ? "Recommendations synthesized by Gemini over data-joined district indicators"
                  : "Deterministic rule-based recommendation builder over Census 2011 & NITI Aayog indicators"
              }
            >
              {engineMode === "gemini" ? "gemini" : "rule-based"}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-help border border-[var(--border-dim)] rounded px-1.5 py-0.5 bg-[var(--bg-elevated)]"
              title={PRIORITY_FORMULA_TOOLTIP}
              aria-label={PRIORITY_FORMULA_TOOLTIP}
            >
              <Info className="w-3 h-3 text-[var(--brand-secondary)]" />
              <span>Formula</span>
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-2 mt-1">
            <span>Census 2011 + NFHS-5 + NITI Aayog joined • {lastUpdated}</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowRankComparison((prev) => !prev)}
              className="text-[11px] font-medium text-[var(--brand-secondary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{showRankComparison ? "Show Dossier List" : "Raw vs Need Rank"}</span>
            </button>
          </div>
        </div>

        {/* Refresh Icon Button */}
        <button
          type="button"
          onClick={() => fetchPriorities(true)}
          disabled={isLoading}
          className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
          title="Re-run Data-Joined Prioritization"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--brand-secondary)]" : ""}`} />
        </button>
      </div>

      {/* SLA BREACH ALERT BANNER (If breachedCount > 0) */}
      {breachedCount > 0 && (
        <div className="p-3 pb-1 border-b border-[var(--border-dim)] bg-[var(--bg-base)]/50">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-red-500 text-[16px]">🚨</span>
            <div>
              <p className="text-[12px] font-bold text-red-500">
                {breachedCount} SLA Breaches
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {breachedCount} complaints exceeded resolution deadline
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QUICK FILTER CHIPS */}
      <div className="px-3 py-2 border-b border-[var(--border-dim)] bg-[var(--bg-base)]/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterCategory("all")}
          className={`h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
            filterCategory === "all"
              ? "bg-[var(--brand-primary)] text-white shadow-xs"
              : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-white"
          }`}
        >
          All ({recommendations.length})
        </button>
        {["roads", "water", "electricity", "sanitation", "health", "education"].map((cat) => {
          const count = recommendations.filter((r) => r.category.toLowerCase() === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`h-6 px-2 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap capitalize cursor-pointer ${
                filterCategory === cat
                  ? "bg-[var(--brand-primary)] text-white shadow-xs"
                  : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-white"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* BODY LIST (smooth scrollbar) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-dim)]">
        {isLoading && recommendations.length === 0 ? (
          <div className="divide-y divide-[var(--border-dim)]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[60px] p-3 px-4 flex items-center gap-3 skeleton-shimmer"
              >
                <div className="w-8 h-8 rounded-[6px] bg-[var(--border-base)] shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-4 rounded-[3px] bg-[var(--border-base)]" />
                    <div className="w-24 h-4 rounded-[3px] bg-[var(--border-base)]" />
                  </div>
                  <div className="w-36 h-2.5 rounded-[2px] bg-[var(--border-base)]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-[12px] text-[var(--text-secondary)]">
            No actionable priority clusters in this sector.
          </div>
        ) : showRankComparison ? (
          <div className="p-3 space-y-2 text-[11px]" id="raw-vs-need-rank-panel">
            <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] p-2 rounded border border-[var(--border-dim)]">
              <strong>Raw complaint count rank vs Need-weighted rank:</strong> normalizing by Census 2011 population (complaints/100k), literacy deprivation, and NITI Aayog Aspirational status prevents high-population metros from crowding out underserved districts.
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-dim)] text-[10px] uppercase text-[var(--text-tertiary)]">
                  <th className="py-1.5 pr-2">District (Sector)</th>
                  <th className="py-1.5 px-2 text-center">Raw Rank</th>
                  <th className="py-1.5 px-2 text-center">Need Rank</th>
                  <th className="py-1.5 pl-2 text-right">Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]">
                {filteredRecommendations.map((item) => {
                  const rawRank = item.raw_rank ?? item.rank;
                  const delta = item.rank_delta ?? rawRank - item.rank;
                  return (
                    <tr key={`${item.district}-${item.category}`} className="hover:bg-[var(--bg-elevated)]/40">
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {item.district}{" "}
                          <span className="text-[10px] uppercase text-[var(--text-tertiary)]">
                            ({item.category})
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                          {item.count} complaints •{" "}
                          {item.population_2011
                            ? `Pop ${(item.population_2011 / 100000).toFixed(1)}L`
                            : "insufficient data"}
                          {item.aspirational_district ? " • Aspirational" : ""}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[var(--text-secondary)]">
                        #{rawRank}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-[var(--brand-secondary)]">
                        #{item.rank}
                      </td>
                      <td className="py-2 pl-2 text-right font-mono font-semibold">
                        {delta > 0 ? (
                          <span className="text-[var(--green)]">▲ +{delta}</span>
                        ) : delta < 0 ? (
                          <span className="text-amber-400">▼ {delta}</span>
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
        ) : (
          filteredRecommendations.map((item) => {
            const isExpanded = expandedRank === item.rank;
            const isTopRank = item.rank === 1;
            const isCopied = copiedRank === item.rank;
            const rawRank = item.raw_rank ?? item.rank;
            const delta = item.rank_delta ?? rawRank - item.rank;

            return (
              <div
                key={item.rank}
                className={`transition-colors relative group/item ${
                  isExpanded ? "bg-[var(--bg-elevated)]/60" : "hover:bg-[var(--bg-elevated)]/40"
                }`}
              >
                {/* ROW HEADER (COLLAPSED VIEW) */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.rank)}
                  className="w-full p-3 px-4 flex items-center justify-between text-left cursor-pointer transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-[var(--radius-sm)] text-[12px] font-bold font-mono flex items-center justify-center shrink-0 ${
                        isTopRank
                          ? "bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-xs ring-1 ring-[var(--brand-primary)]/40"
                          : item.rank <= 3
                          ? "bg-[var(--brand-subtle)] text-[var(--brand-secondary)] border border-[var(--brand-primary)]/30"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-dim)]"
                      }`}
                    >
                      #{item.rank}
                    </div>

                    {/* Category badge + District */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={item.category as any}
                          className="capitalize font-semibold text-[11px] py-0 px-1.5"
                        >
                          {item.category}
                        </Badge>
                        <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                          {item.district}
                        </span>
                        {item.aspirational_district && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Aspirational
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="truncate max-w-[100px]">{item.state}</span>
                        <span>•</span>
                        <span className="font-mono text-[var(--text-secondary)]">
                          {item.count} reports
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px]" title="Raw complaint count rank vs Need-weighted rank">
                          Raw #{rawRank} → Need #{item.rank}{" "}
                          {delta > 0 ? (
                            <span className="text-[var(--green)]">(▲+{delta})</span>
                          ) : delta < 0 ? (
                            <span className="text-amber-400">(▼{delta})</span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Need score & expand toggle */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <div
                        className={`text-[12px] font-bold font-mono ${
                          item.avg_urgency >= 4
                            ? "text-[var(--red)]"
                            : item.avg_urgency >= 3
                            ? "text-[var(--amber)]"
                            : "text-[var(--green)]"
                        }`}
                      >
                        {item.avg_urgency.toFixed(1)} <span className="text-[10px] text-[var(--text-tertiary)] font-normal">/ 5</span>
                      </div>
                      {item.need_weighted_score !== undefined && (
                        <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                          Score {item.need_weighted_score.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="text-[var(--text-tertiary)]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--brand-secondary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>

                {/* EXPANDED DETAIL DRAWER */}
                {isExpanded && (
                  <div className="p-3 px-4 pt-1 bg-[var(--bg-subtle)] border-t border-[var(--border-dim)] space-y-2.5 text-[12px] animate-in fade-in duration-150">
                    {item.project_title && (
                      <div className="text-[12px] font-semibold text-[var(--text-primary)]">
                        {item.project_title}
                      </div>
                    )}

                    {/* Evidence & Rationale */}
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[var(--brand-secondary)]" />
                          <span>Data-Joined Evidence ({item.engine || engineMode})</span>
                        </span>
                        <span className="font-mono text-[10px] text-[var(--brand-secondary)]">
                          Confidence: {item.confidence || "insufficient_data"}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-[12px] bg-[var(--bg-surface)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)]">
                        {item.evidence || item.ai_rationale}
                      </p>
                    </div>

                    {/* Census 2011 Beneficiaries & Scheme */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-[var(--border-dim)]">
                      <div>
                        <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                          <Users className="w-3 h-3 text-[var(--brand-secondary)]" />
                          Census 2011 Population
                        </span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {item.population_2011 !== null && item.population_2011 !== undefined
                            ? item.population_2011.toLocaleString()
                            : "insufficient data"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-tertiary)] block">
                          Relevant Scheme
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {item.relevant_scheme || "None (Municipal Budget)"}
                        </span>
                      </div>
                    </div>

                    {/* Recommended action */}
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-[0.06em] text-[var(--green)] mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--green)]" />
                          <span>Prescribed Action</span>
                        </span>
                        {item.owning_department && (
                          <span className="text-[10px] text-[var(--text-secondary)] normal-case">
                            {item.owning_department}
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-primary)] font-medium bg-[rgba(34,197,94,0.06)] p-2.5 rounded-[var(--radius-sm)] border border-[rgba(34,197,94,0.2)]">
                        {item.recommended_action}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <a
                        href="/data/SOURCES.md"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[var(--brand-secondary)] hover:underline truncate"
                      >
                        Data sources (SOURCES.md)
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyAction(item)}
                        className="h-6 px-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] border border-[var(--border-base)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-[var(--green)]" />
                            <span className="text-[var(--green)]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* EMERGING ISSUES SECTION (PART 3) */}
      {emergingIssues.length > 0 && (
        <div className="p-3 px-4 border-t border-[var(--border-dim)] bg-[rgba(245,158,11,0.04)] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.06em] text-amber-400 flex items-center gap-1">
              <span>⚡</span> Emerging in Last 48h
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
              new localized spikes
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {emergingIssues.map((item) => (
              <button
                key={`${item.district}-${item.category}`}
                type="button"
                onClick={() => onNavigateToReports?.(item.district, item.category)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.35)] text-amber-300 text-[11px] font-medium cursor-pointer hover:bg-[rgba(245,158,11,0.22)] hover:border-amber-400 transition-all shadow-xs group"
                title={`Click to filter reports by ${item.category} in ${item.district}`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="capitalize">{item.category}</span>
                <span className="text-amber-500/60">·</span>
                <span className="font-semibold text-amber-200">{item.district}</span>
                <span className="text-amber-500/60">·</span>
                <span className="font-mono text-amber-300/90">{item.recentCount} reports in 48h</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
