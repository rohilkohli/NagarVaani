'use client';

import React, { useMemo } from "react";
import { DEPARTMENTS, Department, getDepartmentForCategory, getSLAStatus } from "@/lib/departments";
import { Submission } from "@/lib/types";
import { Building2, AlertTriangle, CheckCircle2, Clock, ArrowRight, ShieldAlert } from "lucide-react";

interface DepartmentViewProps {
  submissions: Submission[];
  onNavigateToReports?: (category: string, filterTerm?: string) => void;
  onSelectTab?: (tab: string) => void;
}

export default function DepartmentView({
  submissions = [],
  onNavigateToReports,
  onSelectTab,
}: DepartmentViewProps) {
  // Aggregate data per department
  const departmentStats = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      // Find all submissions mapped to this department
      const deptSubs = submissions.filter((s) => {
        const d = getDepartmentForCategory(s.category || "other");
        return d.id === dept.id;
      });

      const total = deptSubs.length;
      const resolved = deptSubs.filter((s) => s.status === "resolved").length;
      const pending = total - resolved;

      let onTrack = 0;
      let atRisk = 0;
      let breached = 0;

      deptSubs.forEach((s) => {
        const sla = getSLAStatus(s.category, new Date(s.created_at), s.status);
        if (sla === "breached") breached += 1;
        else if (sla === "at_risk") atRisk += 1;
        else onTrack += 1;
      });

      // Find most urgent unresolved complaint
      const unresolvedSubs = deptSubs.filter((s) => s.status !== "resolved");
      const mostUrgent = unresolvedSubs.sort((a, b) => (b.urgency || 0) - (a.urgency || 0))[0] || null;

      return {
        dept,
        total,
        pending,
        resolved,
        onTrack,
        atRisk,
        breached,
        mostUrgent,
      };
    });
  }, [submissions]);

  // Overall Department / SLA summary counts
  const totalBreached = useMemo(() => {
    return departmentStats.reduce((acc, curr) => acc + curr.breached, 0);
  }, [departmentStats]);

  const totalAtRisk = useMemo(() => {
    return departmentStats.reduce((acc, curr) => acc + curr.atRisk, 0);
  }, [departmentStats]);

  const handleAssignClick = (dept: Department) => {
    if (onNavigateToReports) {
      // Filter reports by first category of dept, or general
      onNavigateToReports(dept.categories[0] || "all", dept.shortName);
    } else if (onSelectTab) {
      onSelectTab("reports");
    }
  };

  return (
    <div className="space-y-6" id="department-view-container">
      {/* HEADER OVERVIEW BANNER */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight">
                Department SLA Command Center
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                AI Auto-Routed
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Live automated grievance dispatch across 6 nodal departments with time-bound SLA monitoring.
            </p>
          </div>
        </div>

        {/* Global SLA Health Status Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase text-red-500 block leading-tight">
                Breached
              </span>
              <span className="font-mono text-[14px] font-bold text-red-500">
                {totalBreached}
              </span>
            </div>
          </div>

          <div className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-500 block leading-tight">
                At Risk (&lt;24h)
              </span>
              <span className="font-mono text-[14px] font-bold text-amber-500">
                {totalAtRisk}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-COLUMN RESPONSIVE BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4.5">
        {departmentStats.map(({ dept, total, pending, resolved, onTrack, atRisk, breached, mostUrgent }) => {
          const totalValid = total || 1;
          const onTrackPct = total > 0 ? (onTrack / totalValid) * 100 : 100;
          const atRiskPct = total > 0 ? (atRisk / totalValid) * 100 : 0;
          const breachedPct = total > 0 ? (breached / totalValid) * 100 : 0;

          return (
            <div
              key={dept.id}
              id={`dept-card-${dept.id}`}
              className="bg-[var(--bg-surface)] border border-[var(--border-dim)] hover:border-[var(--border-base)] rounded-[var(--radius-md)] p-4.5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-xs group"
            >
              <div>
                {/* 1. CARD HEADER: Icon + Short Name (H3) + SLA Badge */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-dim)]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] shrink-0 border"
                      style={{
                        backgroundColor: `${dept.color}15`,
                        borderColor: `${dept.color}30`,
                      }}
                    >
                      <span>{dept.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                        {dept.shortName}
                      </h3>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate max-w-[170px]" title={dept.name}>
                        {dept.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-full border whitespace-nowrap"
                    style={{
                      color: dept.color,
                      backgroundColor: `${dept.color}15`,
                      borderColor: `${dept.color}35`,
                    }}
                  >
                    {dept.sla_days} days SLA
                  </span>
                </div>

                {/* 2. STATS ROW: Total | Pending | Resolved */}
                <div className="grid grid-cols-3 gap-2 py-3.5 my-1 text-center bg-[var(--bg-elevated)]/50 rounded-xl border border-[var(--border-dim)]">
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block">
                      Total
                    </span>
                    <span className="font-mono text-[16px] font-bold text-[var(--text-primary)]">
                      {total}
                    </span>
                  </div>
                  <div className="border-x border-[var(--border-dim)]">
                    <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider block">
                      Pending
                    </span>
                    <span className="font-mono text-[16px] font-bold text-amber-500">
                      {pending}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--green)] uppercase tracking-wider block">
                      Resolved
                    </span>
                    <span className="font-mono text-[16px] font-bold text-[var(--green)]">
                      {resolved}
                    </span>
                  </div>
                </div>

                {/* 3. SLA HEALTH BAR (3 segments) */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-[var(--text-secondary)] font-semibold text-[10px] uppercase tracking-wider">
                      SLA Health
                    </span>
                    <div className="flex items-center gap-2.5 text-[10px] font-mono">
                      <span className="text-[var(--green)] flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" /> {onTrack}
                      </span>
                      <span className="text-amber-500 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {atRisk}
                      </span>
                      <span className="text-red-500 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {breached}
                      </span>
                    </div>
                  </div>

                  {/* Multi-segment progress bar */}
                  <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden flex">
                    {onTrackPct > 0 && (
                      <div
                        style={{ width: `${onTrackPct}%` }}
                        className="h-full bg-[var(--green)] transition-all duration-300"
                        title={`On Track: ${onTrack}`}
                      />
                    )}
                    {atRiskPct > 0 && (
                      <div
                        style={{ width: `${atRiskPct}%` }}
                        className="h-full bg-amber-500 transition-all duration-300"
                        title={`At Risk: ${atRisk}`}
                      />
                    )}
                    {breachedPct > 0 && (
                      <div
                        style={{ width: `${breachedPct}%` }}
                        className="h-full bg-red-500 transition-all duration-300"
                        title={`Breached: ${breached}`}
                      />
                    )}
                  </div>
                </div>

                {/* 4. MOST URGENT COMPLAINT (one line) */}
                <div className="mt-2 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-dim)]">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" /> Most Urgent Incident
                    </span>
                    {mostUrgent && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((u) => (
                          <span
                            key={u}
                            className={`w-1.5 h-1.5 rounded-full ${
                              u <= (mostUrgent.urgency || 1)
                                ? mostUrgent.urgency >= 4
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                                : "bg-[var(--border-base)]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {mostUrgent ? (
                    <div className="text-[12px] text-[var(--text-primary)]">
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {mostUrgent.district}:
                      </span>{" "}
                      <span className="line-clamp-1 text-[var(--text-secondary)]">
                        {mostUrgent.summary_english || mostUrgent.text}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--text-tertiary)] italic">
                      No unresolved grievances pending in this department.
                    </p>
                  )}
                </div>
              </div>

              {/* 5. FOOTER: "Assign to {dept.shortName}" BUTTON */}
              <div className="pt-3.5 mt-3 border-t border-[var(--border-dim)]">
                <button
                  type="button"
                  id={`btn-assign-${dept.id}`}
                  onClick={() => handleAssignClick(dept)}
                  className="w-full h-9 rounded-xl border border-[var(--border-dim)] hover:border-[var(--brand-primary)] bg-[var(--bg-surface)] hover:bg-[var(--brand-subtle)] text-[var(--text-primary)] text-[12px] font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-2xs select-none"
                >
                  <span>Filter {dept.shortName} Reports</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
