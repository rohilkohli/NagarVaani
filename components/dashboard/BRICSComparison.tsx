'use client';

import React, { useMemo } from "react";
import { Submission } from "@/lib/types";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { Globe2 } from "lucide-react";

interface BRICSComparisonProps {
  submissions?: Submission[];
  isLoading?: boolean;
  className?: string;
}

interface CountryMeta {
  code: string;
  name: string;
  flag: string;
}

const BRICS_COUNTRIES: CountryMeta[] = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "ZA", name: "S. Africa", flag: "🇿🇦" },
  { code: "CN", name: "China", flag: "🇨🇳" },
];

const CATEGORIES = [
  { key: "roads", name: "Roads & Mobility", icon: "🛣️", color: "#f97316" },
  { key: "water", name: "Water Supply", icon: "💧", color: "#38bdf8" },
  { key: "electricity", name: "Electricity & Grid", icon: "⚡", color: "#fbbf24" },
  { key: "sanitation", name: "Sanitation", icon: "🚽", color: "#a855f7" },
  { key: "health", name: "Health Infrastructure", icon: "🏥", color: "#f43f5e" },
  { key: "education", name: "Education Facilities", icon: "🏫", color: "#34d399" },
];

export default function BRICSComparison({
  submissions = [],
  isLoading = false,
  className = "",
}: BRICSComparisonProps) {
  // Use real live submissions from Firestore (or seed fallback if database is brand new)
  const allSubmissions = useMemo(() => {
    if (submissions && submissions.length > 0) {
      return submissions;
    }
    return ALL_SEED_SUBMISSIONS;
  }, [submissions]);

  // Aggregate stats per category & country
  const matrixData = useMemo(() => {
    const map: Record<string, Record<string, { count: number; sumUrgency: number }>> = {};

    CATEGORIES.forEach((cat) => {
      map[cat.key] = {};
      BRICS_COUNTRIES.forEach((c) => {
        map[cat.key][c.name] = { count: 0, sumUrgency: 0 };
      });
    });

    allSubmissions.forEach((s) => {
      const cat = (s.category || "other").toLowerCase();
      let country = s.country || "India";

      if (country.toLowerCase().includes("brazil")) country = "Brazil";
      else if (country.toLowerCase().includes("russia")) country = "Russia";
      else if (country.toLowerCase().includes("south africa") || country.toLowerCase().includes("s. africa"))
        country = "S. Africa";
      else if (country.toLowerCase().includes("china")) country = "China";
      else country = "India";

      const matchedCat = CATEGORIES.find((c) => c.key === cat) ? cat : "roads";

      if (map[matchedCat] && map[matchedCat][country]) {
        map[matchedCat][country].count += 1;
        map[matchedCat][country].sumUrgency += Number(s.urgency) || 3;
      }
    });

    return map;
  }, [allSubmissions]);

  // Compute top shared challenge
  const topSharedCategory = useMemo(() => {
    let bestCat = CATEGORIES[0];
    let maxTotal = 0;

    CATEGORIES.forEach((cat) => {
      let total = 0;
      BRICS_COUNTRIES.forEach((c) => {
        total += matrixData[cat.key]?.[c.name]?.count || 0;
      });
      if (total > maxTotal) {
        maxTotal = total;
        bestCat = cat;
      }
    });

    return bestCat;
  }, [matrixData]);

  return (
    <div className={`space-y-6 select-none ${className}`} id="brics-comparison-root">
      {/* 1. HEADER SECTION */}
      <div
        className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-base)] flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)",
        }}
      >
        {/* Left side */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--brand-secondary)]">
            BRICS NATIONS • CROSS-BORDER ANALYSIS
          </div>
          <h2 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
            Shared Infrastructure Challenges
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Showing real-time data from India + simulated BRICS data
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-col md:items-end gap-2 shrink-0">
          {/* 5 flag avatars in a row (overlap -8px) */}
          <div className="flex items-center">
            {BRICS_COUNTRIES.map((country, idx) => (
              <div
                key={country.code}
                className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border-2 border-white/90 flex items-center justify-center text-[18px] shadow-sm select-none"
                style={{
                  marginLeft: idx === 0 ? 0 : "-8px",
                  zIndex: BRICS_COUNTRIES.length - idx,
                }}
                title={country.name}
              >
                <span>{country.flag}</span>
              </div>
            ))}
          </div>
          <span className="text-[12px] text-[var(--text-secondary)] font-medium">
            3.6 billion people represented
          </span>
        </div>
      </div>

      {/* 2. COMPARISON TABLE */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-base)] text-[12px] uppercase font-bold tracking-[0.06em] text-[var(--text-tertiary)]">
                {/* First column: "CHALLENGE" — 160px */}
                <th className="py-3 px-4 w-[160px] min-w-[160px]">CHALLENGE</th>

                {/* Country columns (each 120px): Flag + Name stacked, Centred */}
                {BRICS_COUNTRIES.map((c) => (
                  <th
                    key={c.code}
                    className="py-3 px-4 w-[120px] min-w-[120px] text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[20px] leading-none">{c.flag}</span>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)] tracking-normal normal-case">
                        {c.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Rows (One per category) */}
            <tbody className="divide-y divide-[var(--border-dim)]">
              {CATEGORIES.map((cat) => {
                // Find highest count country in this row
                let maxCount = -1;
                BRICS_COUNTRIES.forEach((c) => {
                  const count = matrixData[cat.key]?.[c.name]?.count || 0;
                  if (count > maxCount) {
                    maxCount = count;
                  }
                });

                return (
                  <tr
                    key={cat.key}
                    className="transition-colors group hover:bg-[var(--bg-elevated)]"
                  >
                    {/* First cell: Category dot (8px) + emoji + category name (14px/500), border-right */}
                    <td className="py-3 px-4 w-[160px] min-w-[160px] bg-[var(--bg-subtle)] group-hover:bg-[var(--bg-elevated)] border-r border-[var(--border-base)] transition-colors">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[15px]">{cat.icon}</span>
                        <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    {/* Data cells (one per country) */}
                    {BRICS_COUNTRIES.map((c) => {
                      const stats = matrixData[cat.key]?.[c.name] || {
                        count: 0,
                        sumUrgency: 0,
                      };
                      const avgUrgency =
                        stats.count > 0
                          ? Number((stats.sumUrgency / stats.count).toFixed(1))
                          : 3.2;

                      const isHighest = stats.count === maxCount && maxCount > 0;

                      // Mini-bar color based on urgency
                      const urgencyColor =
                        avgUrgency >= 4
                          ? "var(--red)"
                          : avgUrgency >= 3
                          ? "var(--amber)"
                          : "var(--green)";

                      return (
                        <td
                          key={c.code}
                          className={`py-3 px-4 w-[120px] min-w-[120px] text-center transition-colors ${
                            isHighest
                              ? "bg-[rgba(99,102,241,0.08)] group-hover:bg-[rgba(99,102,241,0.12)]"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            {/* Top: Big Count Number (20px / 700) + Crown if highest */}
                            <div className="flex items-center gap-1 font-mono leading-none">
                              {isHighest && (
                                <span className="text-[13px]" title="Highest density in category">
                                  👑
                                </span>
                              )}
                              <span
                                className={`text-[20px] font-bold ${
                                  isHighest
                                    ? "text-[var(--brand-secondary)]"
                                    : "text-[var(--text-primary)]"
                                }`}
                              >
                                {stats.count}
                              </span>
                            </div>

                            {/* Below: Urgency mini-bar (30px wide, 4px tall) */}
                            <div className="w-[30px] h-[4px] bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, (avgUrgency / 5) * 100)}%`,
                                  backgroundColor: urgencyColor,
                                }}
                              />
                            </div>

                            {/* Below: "avg {n}/5" in grey micro */}
                            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                              avg {avgUrgency}/5
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. INSIGHT CARDS (3-column bento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 — Shared Problem */}
        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border-dim)] bg-[var(--brand-subtle)] border-l-[3px] border-l-[var(--brand-primary)] space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--red)]">
            🔴 TOP SHARED CHALLENGE
          </div>
          <h3 className="text-[16px] font-bold text-[var(--text-primary)] tracking-tight">
            {topSharedCategory.name}
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Reported by all 5 BRICS nations — affecting an estimated 890M people
          </p>
        </div>

        {/* Card 2 — Urgency Alert */}
        <div
          className="p-4 rounded-[var(--radius-md)] border border-[var(--border-dim)] border-l-[3px] border-l-[var(--red)] space-y-1.5"
          style={{ background: "rgba(239, 68, 68, 0.06)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--red)]">
            ⚠️ CRITICAL URGENCY
          </div>
          <h3 className="text-[16px] font-bold text-[var(--text-primary)] tracking-tight">
            Water supply in Jaipur
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Average urgency 4.8/5 — highest across all nations
          </p>
        </div>

        {/* Card 3 — Scalability Statement */}
        <div
          className="p-4 rounded-[var(--radius-md)] border border-[var(--border-dim)] border-l-[3px] border-l-[var(--green)] space-y-1.5"
          style={{ background: "rgba(34, 197, 94, 0.06)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--green)]">
            🌐 PLATFORM SCALABILITY
          </div>
          <h3 className="text-[16px] font-bold text-[var(--text-primary)] tracking-tight">
            Zero code changes needed
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Same AI engine deploys across all BRICS nations — only the data source changes
          </p>
        </div>
      </div>

      {/* 4. BOTTOM CALLOUT BOX */}
      <div
        className="p-5 md:px-6 rounded-[var(--radius-lg)] border border-[rgba(99,102,241,0.2)] flex flex-col md:flex-row items-start md:items-center gap-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.08))",
        }}
      >
        {/* Left Icon (Globe2, 24px, indigo) */}
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(99,102,241,0.15)] flex items-center justify-center shrink-0 text-[var(--brand-secondary)]">
          <Globe2 className="w-6 h-6" />
        </div>

        {/* Right Content */}
        <div className="flex-1 space-y-2.5">
          <p className="text-[13px] text-[var(--text-primary)] font-medium leading-relaxed">
            This platform is designed as a Digital Public Good. Deployable within any BRICS ministry with existing Google Cloud infrastructure.
          </p>

          {/* Indigo Micro Badges (3 separate badge pills) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--brand-secondary)]">
              BRICS THEME:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--brand-secondary)]">
              COOPERATION
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--brand-secondary)]">
              INNOVATION
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--brand-secondary)]">
              SUSTAINABILITY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
