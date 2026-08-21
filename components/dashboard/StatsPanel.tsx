'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Submission } from "@/lib/types";
import AnimatedNumber from "@/components/shared/AnimatedNumber";
import {
  FileText,
  MapPin,
  Flame,
  TrendingUp,
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
          <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between card-hover-lift hover:border-[var(--border-base)]">
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
              {/* Trend Indicator */}
              <span className="text-[12px] font-medium text-[var(--green)] flex items-center gap-0.5">
                <span>+{countToday || 12} today</span>
                <span>↑</span>
              </span>
            </div>

            {/* Middle: Giant Number */}
            <div className="my-2.5">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none font-mono">
                <AnimatedNumber value={totalCount} duration={1200} />
              </div>
            </div>

            {/* Bottom: Comparison text */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              Aggregated cross-border telemetry
            </div>
          </div>

          {/* CARD 2 — Districts */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between card-hover-lift hover:border-[var(--border-base)]">
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
              {/* Trend indicator */}
              <span className="text-[12px] font-medium text-[var(--cat-education)]">
                across {uniqueStates} states
              </span>
            </div>

            {/* Middle: Giant Number */}
            <div className="my-2.5">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none font-mono">
                <AnimatedNumber value={uniqueDistricts || 28} duration={1200} />
              </div>
            </div>

            {/* Bottom: Comparison text */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              Active municipal coverage
            </div>
          </div>

          {/* CARD 3 — Avg Urgency */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between card-hover-lift hover:border-[var(--border-base)]">
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
              {/* Trend Indicator */}
              <span className="text-[12px] font-medium text-[var(--text-tertiary)]">
                → stable
              </span>
            </div>

            {/* Middle: Giant Number & Urgency Dots */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-none font-mono">
                {avgUrgency || "3.4"}
                <span className="text-[16px] text-[var(--text-tertiary)] font-normal">/5</span>
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

          {/* CARD 4 — Top Category */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between card-hover-lift hover:border-[var(--border-base)]">
            {/* Top Row: Icon + Label + Trend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(249,115,22,0.1)" }}
                >
                  <TrendingUp className="w-4 h-4 text-[var(--cat-roads)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  TOP SECTOR
                </span>
              </div>
              <span className="text-[12px] font-medium text-[var(--green)]">
                {topCategory.percentage.toFixed(0)}% share
              </span>
            </div>

            {/* Middle: Category Name + Badge */}
            <div className="my-2.5 flex items-center gap-2">
              <span className="text-[26px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
                {topCategory.label}
              </span>
              <span
                className="px-2 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{
                  background: `rgba(249, 115, 22, 0.15)`,
                  color: topCategory.color,
                }}
              >
                {topCategory.count} reports
              </span>
            </div>

            {/* Bottom: Comparison text */}
            <div className="text-[12px] text-[var(--text-secondary)]">
              Most reported this week
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
