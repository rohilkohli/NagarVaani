'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Submission } from "@/lib/types";
import AnimatedNumber from "@/components/shared/AnimatedNumber";
import {
  FileText,
  MapPin,
  Flame,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

interface StatsPanelProps {
  submissions: Submission[];
  allSubmissions?: Submission[];
  timeRange?: "today" | "7d" | "30d" | "90d" | "all";
  isLoading?: boolean;
  className?: string;
  showStatCards?: boolean;
  showBreakdownAndTrend?: boolean;
}

const CATEGORY_META: Record<string, { label: string; color: string; cssVar: string }> = {
  roads: { label: "Roads", color: "#f97316", cssVar: "var(--cat-roads)" },
  water: { label: "Water", color: "#38bdf8", cssVar: "var(--cat-water)" },
  electricity: { label: "Electricity", color: "#fbbf24", cssVar: "var(--cat-electricity)" },
  sanitation: { label: "Sanitation", color: "#a855f7", cssVar: "var(--cat-sanitation)" },
  health: { label: "Health", color: "#f43f5e", cssVar: "var(--cat-health)" },
  education: { label: "Education", color: "#34d399", cssVar: "var(--cat-education)" },
  other: { label: "Other", color: "#8b8b9e", cssVar: "var(--text-secondary)" },
};

export default function StatsPanel({
  submissions = [],
  allSubmissions,
  timeRange = "30d",
  isLoading = false,
  className = "",
  showStatCards = true,
  showBreakdownAndTrend = true,
}: StatsPanelProps) {
  // Viewport intersection observer for category bars animation
  const breakdownRef = useRef<HTMLDivElement | null>(null);
  const [isBreakdownInView, setIsBreakdownInView] = useState<boolean>(false);

  useEffect(() => {
    if (!breakdownRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsBreakdownInView(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(breakdownRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculations
  const totalCount = submissions.length;

  const countToday = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return submissions.filter((s) => {
      if (!s.created_at) return false;
      const d = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
      if (isNaN(d.getTime())) return false;
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    }).length;
  }, [submissions]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set(
      submissions.map((s) => s.district?.trim()).filter(Boolean)
    );
    return set.size;
  }, [submissions]);

  const uniqueStates = useMemo(() => {
    const set = new Set(
      submissions.map((s) => s.state?.trim()).filter(Boolean)
    );
    return Math.max(set.size, 1);
  }, [submissions]);

  const avgUrgency = useMemo(() => {
    if (submissions.length === 0) return 0;
    const sum = submissions.reduce((acc, s) => acc + (Number(s.urgency) || 3), 0);
    return Number((sum / submissions.length).toFixed(1));
  }, [submissions]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(CATEGORY_META).forEach((cat) => {
      counts[cat] = 0;
    });

    submissions.forEach((s) => {
      const cat = (s.category || "other").toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      } else {
        counts["other"] = (counts["other"] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([key, count]) => {
        const meta = CATEGORY_META[key] || CATEGORY_META.other;
        const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
        return {
          key,
          label: meta.label,
          count,
          percentage: pct,
          color: meta.color,
          cssVar: meta.cssVar,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [submissions, totalCount]);

  const topCategory = categoryBreakdown[0] || {
    key: "roads",
    label: "Roads",
    count: 0,
    percentage: 0,
    color: "#f97316",
    cssVar: "var(--cat-roads)",
  };

  const resolvedCount = useMemo(() => {
    return submissions.filter((s) => s.status === "resolved").length;
  }, [submissions]);

  // Channel breakdown counts
  const { webCount, whatsappCount } = useMemo(() => {
    let web = 0;
    let wa = 0;
    submissions.forEach((s) => {
      if (s.source === "whatsapp") {
        wa += 1;
      } else {
        web += 1;
      }
    });
    return { webCount: web, whatsappCount: wa };
  }, [submissions]);

  const resolutionRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((resolvedCount / totalCount) * 100);
  }, [resolvedCount, totalCount]);

  const resolutionColor =
    resolutionRate > 50
      ? "var(--green)"
      : resolutionRate >= 20
      ? "var(--amber)"
      : "var(--red)";

  // PART 2 — Calculate previous equivalent period submissions for dynamic trend comparisons
  const previousPeriodSubmissions = useMemo(() => {
    const dataset = allSubmissions && allSubmissions.length > 0 ? allSubmissions : submissions;
    const now = Date.now();

    let previousStart = now - 60 * 24 * 3600 * 1000;
    let previousEnd = now - 30 * 24 * 3600 * 1000;

    if (timeRange === "today") {
      previousStart = now - 48 * 3600 * 1000;
      previousEnd = now - 24 * 3600 * 1000;
    } else if (timeRange === "7d") {
      previousStart = now - 14 * 24 * 3600 * 1000;
      previousEnd = now - 7 * 24 * 3600 * 1000;
    } else if (timeRange === "30d") {
      previousStart = now - 60 * 24 * 3600 * 1000;
      previousEnd = now - 30 * 24 * 3600 * 1000;
    } else if (timeRange === "90d") {
      previousStart = now - 180 * 24 * 3600 * 1000;
      previousEnd = now - 90 * 24 * 3600 * 1000;
    } else if (timeRange === "all") {
      return [];
    }

    return dataset.filter((s) => {
      if (!s.created_at) return false;
      const d = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
      const time = d.getTime();
      if (isNaN(time)) return false;
      return time >= previousStart && time < previousEnd;
    });
  }, [allSubmissions, submissions, timeRange]);

  const calculateDelta = (current: number, previous: number) => {
    if (timeRange === "all") {
      return { text: "→ Stable", color: "text-[var(--text-tertiary)]" };
    }
    if (previous === 0) {
      if (current === 0) {
        return { text: "→ Stable", color: "text-[var(--text-tertiary)]" };
      }
      return { text: "↑ +100%", color: "text-[var(--green)]" };
    }
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    if (pct > 5) {
      return { text: `↑ +${pct}%`, color: "text-[var(--green)]" };
    } else if (pct < -5) {
      return { text: `↓ ${pct}%`, color: "text-[var(--red)]" };
    } else {
      return { text: "→ Stable", color: "text-[var(--text-tertiary)]" };
    }
  };

  // 1. Total reports dynamic trend
  const totalReportsTrend = useMemo(() => {
    return calculateDelta(submissions.length, previousPeriodSubmissions.length);
  }, [submissions.length, previousPeriodSubmissions.length, timeRange]);

  // 2. Districts dynamic trend
  const prevDistrictsCount = useMemo(() => {
    const set = new Set(previousPeriodSubmissions.map((s) => s.district?.trim()).filter(Boolean));
    return set.size;
  }, [previousPeriodSubmissions]);

  const districtsTrend = useMemo(() => {
    return calculateDelta(uniqueDistricts, prevDistrictsCount);
  }, [uniqueDistricts, prevDistrictsCount, timeRange]);

  // 3. Avg urgency dynamic trend
  const prevAvgUrgency = useMemo(() => {
    if (previousPeriodSubmissions.length === 0) return avgUrgency;
    const sum = previousPeriodSubmissions.reduce((acc, s) => acc + (Number(s.urgency) || 3), 0);
    return Number((sum / previousPeriodSubmissions.length).toFixed(1));
  }, [previousPeriodSubmissions, avgUrgency]);

  const urgencyTrend = useMemo(() => {
    return calculateDelta(avgUrgency, prevAvgUrgency);
  }, [avgUrgency, prevAvgUrgency, timeRange]);

  // 4. Resolution rate dynamic trend
  const prevResolutionRate = useMemo(() => {
    if (previousPeriodSubmissions.length === 0) return resolutionRate;
    const resolved = previousPeriodSubmissions.filter((s) => s.status === "resolved").length;
    return Math.round((resolved / previousPeriodSubmissions.length) * 100);
  }, [previousPeriodSubmissions, resolutionRate]);

  const resolutionTrend = useMemo(() => {
    return calculateDelta(resolutionRate, prevResolutionRate);
  }, [resolutionRate, prevResolutionRate, timeRange]);

  // 7-day trend series for recharts
  const trendData = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ dateStr, label: dayLabel, count: 0 });
    }

    submissions.forEach((s) => {
      if (!s.created_at) return;
      const d = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
      if (isNaN(d.getTime())) return;
      const dateStr = d.toISOString().split("T")[0];
      const match = days.find((item) => item.dateStr === dateStr);
      if (match) {
        match.count += 1;
      }
    });

    return days;
  }, [submissions]);

  const weeklyTotal = useMemo(() => {
    return trendData.reduce((acc, item) => acc + item.count, 0);
  }, [trendData]);

  // Round urgency score for dots
  const filledUrgencyDots = Math.min(5, Math.max(0, Math.round(avgUrgency)));

  // If loading, render exact match skeleton
  if (isLoading && submissions.length === 0) {
    return (
      <div className={`space-y-4 ${className}`} id="stats-panel-loading">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 h-[126px] skeleton-shimmer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-4 bg-[var(--border-base)] rounded-[4px]" />
                <div className="w-12 h-4 bg-[var(--border-base)] rounded-[4px]" />
              </div>
              <div className="w-28 h-8 bg-[var(--border-base)] rounded-[6px] my-1" />
              <div className="w-36 h-3 bg-[var(--border-base)] rounded-[4px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} id="stats-panel-root">
      {/* 4 STAT CARDS (span 3 each in 12-col grid) */}
      {showStatCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1 — Total Reports */}
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-dim)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between group cursor-default hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_0_20px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.3)]"
            style={{ transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease' }}
          >
            {/* Top Row: Icon + Label + Trend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{ background: "var(--brand-subtle)" }}
                >
                  <FileText className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  TOTAL REPORTS
                </span>
              </div>
              {/* Dynamic Delta Trend Indicator */}
              <span className={`text-[12px] font-medium font-mono ${totalReportsTrend.color} flex items-center gap-0.5`}>
                <span>{totalReportsTrend.text}</span>
              </span>
            </div>

            {/* Middle: Giant Number */}
            <div className="my-2.5">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
                <span className="font-mono tabular-nums">
                  <AnimatedNumber value={totalCount} duration={1200} />
                </span>
              </div>
            </div>

            {/* Bottom: Comparison text */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              Aggregated cross-border telemetry
            </div>
          </div>

          {/* CARD 2 — Districts */}
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-dim)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between group cursor-default hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.1),0_4px_16px_rgba(0,0,0,0.3)]"
            style={{ transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease' }}
          >
            {/* Top Row: Icon + Label + Trend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(20,184,166,0.1)" }}
                >
                  <MapPin className="w-4 h-4 text-[var(--cat-education)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  DISTRICTS
                </span>
              </div>
              {/* Dynamic Delta Trend indicator */}
              <span className={`text-[12px] font-medium font-mono ${districtsTrend.color}`}>
                {districtsTrend.text}
              </span>
            </div>

            {/* Middle: Giant Number */}
            <div className="my-2.5">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
                <span className="font-mono tabular-nums">
                  <AnimatedNumber value={uniqueDistricts || 28} duration={1200} />
                </span>
              </div>
            </div>

            {/* Bottom: Comparison text */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              Active municipal coverage
            </div>
          </div>

          {/* CARD 3 — Avg Urgency */}
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-dim)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between group cursor-default hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.1),0_4px_16px_rgba(0,0,0,0.3)]"
            style={{ transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease' }}
          >
            {/* Top Row: Icon + Label + Trend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                >
                  <Flame className="w-4 h-4 text-[var(--cat-health)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  AVG URGENCY
                </span>
              </div>
              {/* Dynamic Delta Trend Indicator */}
              <span className={`text-[12px] font-medium font-mono ${urgencyTrend.color}`}>
                {urgencyTrend.text}
              </span>
            </div>

            {/* Middle: Giant Number & Urgency Dots */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
                <span className="font-mono tabular-nums">
                  {avgUrgency || "3.4"}
                </span>
                <span className="text-[16px] text-[var(--text-tertiary)] font-normal ml-0.5">/5</span>
              </div>
              {/* 5 small circles (urgency dots), filled to score */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((dotIndex) => {
                  const isFilled = dotIndex <= filledUrgencyDots;
                  return (
                    <div
                      key={dotIndex}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isFilled
                          ? dotIndex >= 4
                            ? "bg-[var(--red)]"
                            : dotIndex === 3
                            ? "bg-[var(--amber)]"
                            : "bg-[var(--green)]"
                          : "bg-[var(--bg-elevated)] border border-[var(--border-dim)]"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom: Comparison text */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              Gemini triaged risk index
            </div>
          </div>

          {/* CARD 4 — Resolution Rate */}
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-dim)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between group cursor-default hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.1),0_4px_16px_rgba(0,0,0,0.3)]"
            style={{ transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease' }}
          >
            {/* Top Row: Icon + Label + Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,197,94,0.1)" }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[var(--green)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  RESOLUTION RATE
                </span>
              </div>
              <span
                className="text-[12px] font-medium font-mono"
                style={{ color: resolutionColor }}
              >
                {resolvedCount} resolved
              </span>
            </div>

            {/* Middle: Percentage + 48px Circular Progress Indicator */}
            <div className="my-2 flex items-center justify-between">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
                <span className="font-mono tabular-nums">
                  <AnimatedNumber value={resolutionRate} duration={1200} />
                </span>
                <span className="text-[18px] text-[var(--text-tertiary)] font-normal ml-0.5">%</span>
              </div>

              {/* 48px Circular Progress SVG */}
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  {/* Background Track */}
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    className="stroke-[var(--border-base)]"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    stroke={resolutionColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={113.1}
                    strokeDashoffset={113.1 - (Math.min(100, Math.max(0, resolutionRate)) / 100) * 113.1}
                    fill="none"
                    style={{ transition: "stroke-dashoffset 800ms ease, stroke 300ms ease" }}
                  />
                </svg>
                {/* Center Percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">
                    {resolutionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom: Subtitle: "{resolved} of {total} addressed" */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              {resolvedCount} of {totalCount} addressed
            </div>
          </div>
        </div>
      )}

      {/* 5TH CARD / ROW — CHANNEL BREAKDOWN */}
      {showStatCards && (
        <div
          id="channel-breakdown-row"
          className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
              CHANNEL BREAKDOWN
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
              • Ingestion channels
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Web Portal Pill */}
            <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-dim)]">
              <span className="text-[13px] flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                <span>📱</span> Web portal:
              </span>
              <span className="font-mono text-[13px] font-bold text-[var(--brand-primary)] bg-[var(--brand-subtle)] px-2 py-0.5 rounded-[6px]">
                {webCount}
              </span>
            </div>

            {/* WhatsApp Pill */}
            <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-[10px] bg-[#25D366]/10 border border-[#25D366]/30">
              <span className="text-[13px] flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                <span>💬</span> WhatsApp:
              </span>
              <span className="font-mono text-[13px] font-bold text-[#25D366] bg-[#25D366]/20 px-2 py-0.5 rounded-[6px]">
                {whatsappCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY BREAKDOWN (SPAN 5) + TREND MINI CHART (SPAN 7) */}
      {showBreakdownAndTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          {/* CATEGORY BREAKDOWN (span 5) */}
          <div
            ref={breakdownRef}
            className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 space-y-3.5 card-hover-lift hover:border-[var(--border-base)]"
          >
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
              By Category
            </h3>

            {/* List of Category Rows */}
            <div className="space-y-2">
              {categoryBreakdown.slice(0, 6).map((item, index) => (
                <div key={item.key} className="flex items-center gap-3 text-[13px]">
                  {/* Category dot (8px circle) */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Name in 14px */}
                  <span className="w-24 text-[13px] font-medium text-[var(--text-primary)] shrink-0 truncate">
                    {item.label}
                  </span>

                  {/* Bar: 0 -> final percentage with spring easing & 80ms stagger */}
                  <div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-[2px] overflow-hidden">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
                        width: isBreakdownInView ? `${Math.max(item.percentage, 4)}%` : "0%",
                        backgroundColor: item.color,
                        transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                        transitionDelay: `${index * 80}ms`,
                      }}
                    />
                  </div>

                  {/* Count & Percentage */}
                  <div className="w-14 text-right shrink-0">
                    <div className="font-mono text-[13px] font-semibold text-[var(--text-primary)]">
                      {item.count}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      {item.percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TREND MINI CHART (span 7) */}
          <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between card-hover-lift hover:border-[var(--border-base)]">
            {/* Header: Label Left + Total in Indigo Right */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-dim)]">
              <span className="text-[12px] text-[var(--text-tertiary)] font-medium">
                7-Day Submission Trend
              </span>
              <span className="text-[13px] font-semibold text-[var(--brand-secondary)] font-mono">
                {weeklyTotal} this week
              </span>
            </div>

            {/* recharts BarChart (height: 160px) */}
            <div className="w-full h-[160px] pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="var(--text-tertiary)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[13px] text-[var(--text-primary)] shadow-none">
                            <span className="font-semibold text-[var(--brand-secondary)]">
                              {payload[0].value}
                            </span>{" "}
                            reports on {payload[0].payload.dateStr}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--brand-primary)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
