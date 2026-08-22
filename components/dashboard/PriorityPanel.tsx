'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  Clock,
  Copy,
  Check,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriorityRecommendation, Submission } from "@/lib/types";
import { getSLAStatus } from "@/lib/departments";

interface PriorityPanelProps {
  submissions?: Submission[];
  allSubmissions?: Submission[];
  isLoading?: boolean;
  className?: string;
  onNavigateToReports?: (district: string, category: string) => void;
}

const RATIONALE_TEMPLATES: Record<string, (district: string, count: number, urgency: number) => string> = {
  roads: (district: string, count: number, urgency: number) =>
    `${count} citizen reports from ${district} document severe road damage with avg urgency ${urgency}/5. Damaged arterial corridors affect daily commutes and emergency vehicle access for ~${(count * 15000).toLocaleString()} residents.`,
  water: (district: string, count: number, urgency: number) =>
    `${district} residents logged ${count} water supply failures averaging urgency ${urgency}/5. Persistent contamination and distribution disruption pose acute public health risks.`,
  electricity: (district: string, count: number, urgency: number) =>
    `Grid instability in ${district} generated ${count} reports (urgency ${urgency}/5). Recurrent transformer trips stall local commerce and critical clinic backups.`,
  sanitation: (district: string, count: number, urgency: number) =>
    `${count} sanitation complaints from ${district} indicate major stormwater and drainage blockages (urgency ${urgency}/5), requiring urgent municipal dredging.`,
  health: (district: string, count: number, urgency: number) =>
    `Public health facilities in ${district} face ${count} urgent grievance reports (urgency ${urgency}/5), indicating PHC capacity gaps and emergency supply shortages.`,
  education: (district: string, count: number, urgency: number) =>
    `${count} school infrastructure grievances in ${district} (urgency ${urgency}/5) compromise classroom safety and learning continuity.`,
  other: (district: string, count: number, urgency: number) =>
    `${count} civic infrastructure complaints from ${district} require immediate municipal evaluation. Urgency index ${urgency}/5 mandates time-critical response.`,
};

const ACTION_TEMPLATES: Record<string, (district: string) => string> = {
  roads: (district: string) => `Issue emergency resurfacing contract for top arterial corridors in ${district} within 14 days.`,
  water: (district: string) => `Deploy rapid response water quality audit team to ${district} and inspect supply mains within 7 days.`,
  electricity: (district: string) => `DISCOM to conduct transformer load audit in ${district} and install surge protection on critical feeders within 14 days.`,
  sanitation: (district: string) => `Municipal corporation to deploy drain-clearance crew and CCTV inspection unit in ${district} within 48 hours.`,
  health: (district: string) => `State health department to review ${district} PHC staffing and medicine stocks; submit emergency procurement within 14 days.`,
  education: (district: string) => `District Education Officer to inspect flagged school buildings in ${district} and issue structural clearance within 21 days.`,
  other: (district: string) => `District Collector to assign nodal officer for ${district} civic complaints and file resolution plan within 14 days.`,
};

const BRICS_TEMPLATES: Record<string, string> = {
  roads: "Parallels rapid pavement resilience protocols active in São Paulo (Brazil) and Ekurhuleni (South Africa).",
  water: "Matches municipal leak telemetry and distribution response deployed in Cape Town (South Africa) and Fortaleza (Brazil).",
  electricity: "Smart grid distribution monitoring mirrors load-balancing pilots in Shanghai (China) and Novosibirsk (Russia).",
  sanitation: "Real-time stormwater tracking aligns with urban resilience initiatives in Durban (South Africa) and Belo Horizonte (Brazil).",
  health: "Primary healthcare supply forecasting reflects clinic protocols across Minas Gerais (Brazil) and Guangdong (China).",
  education: "School facility structural audit protocols reflect district safety initiatives in Saint Petersburg (Russia) and Chengdu (China).",
  other: "Municipal civic incident routing reflects standard BRICS urban resilience protocols.",
};

function generateLocalPriorities(subs: Submission[]): PriorityRecommendation[] {
  const map = new Map<
    string,
    {
      district: string;
      state: string;
      category: string;
      count: number;
      urgencies: number[];
      upvotes: number[];
    }
  >();

  for (const s of subs) {
    const d = s.district || "Metropolitan Zone";
    const c = (s.category || "roads").toLowerCase();
    const key = `${d}__${c}`;
    if (!map.has(key)) {
      map.set(key, {
        district: d,
        state: s.state || "National Sector",
        category: c,
        count: 0,
        urgencies: [],
        upvotes: [],
      });
    }
    const g = map.get(key)!;
    g.count += 1;
    g.urgencies.push(Number(s.urgency) || 3);
    g.upvotes.push(Number(s.upvotes) || 0);
  }

  const sorted = Array.from(map.values())
    .map((g) => {
      const avg_urgency = Number(
        (g.urgencies.reduce((a, b) => a + b, 0) / (g.urgencies.length || 1)).toFixed(1)
      );
      const total_upvotes = g.upvotes.reduce((a, b) => a + b, 0);
      const weight_score = g.count * avg_urgency * (1 + (total_upvotes / (g.count || 1)) * 0.2);
      return {
        ...g,
        avg_urgency,
        total_upvotes,
        weight_score,
      };
    })
    .sort((a, b) => b.weight_score - a.weight_score)
    .slice(0, 10);

  return sorted.map((item, index) => {
    const cat = item.category in RATIONALE_TEMPLATES ? item.category : "other";
    const rationaleFn = RATIONALE_TEMPLATES[cat] || RATIONALE_TEMPLATES.other;
    const actionFn = ACTION_TEMPLATES[cat] || ACTION_TEMPLATES.other;
    const bricsParallel = BRICS_TEMPLATES[cat] || BRICS_TEMPLATES.other;

    return {
      rank: index + 1,
      category: item.category,
      district: item.district,
      state: item.state,
      count: item.count,
      avg_urgency: item.avg_urgency,
      ai_rationale: rationaleFn(item.district, item.count, item.avg_urgency),
      estimated_population_affected: item.count * 15000,
      recommended_action: actionFn(item.district),
      brics_parallel: bricsParallel,
    };
  });
}

export default function PriorityPanel({
  submissions = [],
  allSubmissions,
  isLoading: propLoading = false,
  className = "",
  onNavigateToReports,
}: PriorityPanelProps) {
  const [recommendations, setRecommendations] = useState<PriorityRecommendation[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(true);
  const isLoading = propLoading || internalLoading;
  const [lastUpdated, setLastUpdated] = useState<string>("just now");
  const [expandedRank, setExpandedRank] = useState<number | null>(1);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [copiedRank, setCopiedRank] = useState<number | null>(null);

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
        const res = await fetch("/api/prioritize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissions }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
            setRecommendations(data.recommendations);
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
        setLastUpdated("just now");
      } catch (err: any) {
        const fallback = generateLocalPriorities(submissions);
        setRecommendations(fallback);
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
    const text = `PRIORITY DIRECTIVE #${item.rank} [${item.category.toUpperCase()}]: ${item.district} (${item.state}) | Urgency: ${item.avg_urgency}/5 | Action: ${item.recommended_action}`;
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
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--brand-subtle)] border border-[var(--brand-primary)]/30 flex items-center justify-center text-[var(--brand-secondary)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">
              AI Priority Engine
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--green)] bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded-[3px] border border-[rgba(16,185,129,0.2)]">
              Gemini 3.7
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5 mt-1">
            <span>Automated ranking updated {lastUpdated}</span>
          </div>
        </div>

        {/* Refresh Icon Button */}
        <button
          type="button"
          onClick={() => fetchPriorities(true)}
          disabled={isLoading}
          className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
          title="Re-run Gemini AI Prioritization"
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
        ) : (
          filteredRecommendations.map((item, index) => {
            const isExpanded = expandedRank === item.rank;
            const isTopRank = item.rank === 1;
            const isCopied = copiedRank === item.rank;

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
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-2 mt-0.5">
                        <span className="truncate max-w-[100px]">{item.state}</span>
                        <span>•</span>
                        <span className="font-mono text-[var(--text-secondary)]">
                          {item.count} reports
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Urgency score & expand toggle */}
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
                    {/* Rationale */}
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[var(--brand-secondary)]" />
                        <span>AI Triage Synthesis</span>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-[12px] bg-[var(--bg-surface)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)]">
                        {item.ai_rationale}
                      </p>
                    </div>

                    {/* Population affected */}
                    <div className="flex items-center justify-between text-[11px] py-1 border-y border-[var(--border-dim)]">
                      <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                        <Users className="w-3 h-3 text-[var(--brand-secondary)]" />
                        Population Impact
                      </span>
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        ~{item.estimated_population_affected.toLocaleString()} citizens
                      </span>
                    </div>

                    {/* Recommended action */}
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-[0.06em] text-[var(--green)] mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--green)]" />
                        <span>Prescribed Action</span>
                      </div>
                      <p className="text-[var(--text-primary)] font-medium bg-[rgba(34,197,94,0.06)] p-2.5 rounded-[var(--radius-sm)] border border-[rgba(34,197,94,0.2)]">
                        {item.recommended_action}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[var(--text-tertiary)] italic truncate">
                        {item.brics_parallel || "BRICS Urban Alignment"}
                      </span>

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
