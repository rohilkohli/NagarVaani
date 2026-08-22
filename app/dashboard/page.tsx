'use client';

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { Submission, ComplaintCategory } from "@/lib/types";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import StatsPanel from "@/components/dashboard/StatsPanel";
import DemandHeatmap from "@/components/dashboard/DemandHeatmap";
import PriorityPanel from "@/components/dashboard/PriorityPanel";
import PriorityRankingsView from "@/components/dashboard/PriorityRankingsView";
import BRICSComparison from "@/components/dashboard/BRICSComparison";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CheckCircle2,
  X,
  Database,
  Cpu,
  RefreshCw,
  Radio,
  PauseCircle,
} from "lucide-react";

export type DashboardTab = "overview" | "heatmap" | "brics" | "reports" | "settings" | "priority";

function formatRelativeTime(date: Date | string | any): string {
  if (!date) return "just now";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "just now";
  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "2m ago";
}

export default function DashboardPage({
  activeTab = "overview",
  onSelectTab,
}: {
  activeTab?: DashboardTab;
  onSelectTab?: (tab: any) => void;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-refresh control for Firestore listener
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nv_auto_refresh");
      return saved !== "false";
    }
    return true;
  });

  const handleToggleAutoRefresh = () => {
    const nextState = !autoRefresh;
    setAutoRefresh(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("nv_auto_refresh", String(nextState));
    }
    setToastMessage(
      nextState
        ? "Auto-Refresh enabled: Live Firestore listener connected."
        : "Auto-Refresh paused: Live data listener disconnected."
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Table filtering & pagination
  const [tableSearch, setTableSearch] = useState<string>("");
  const [tableCategory, setTableCategory] = useState<string>("all");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // 1. REAL-TIME FIRESTORE DATA INTAKE (Active when autoRefresh is true)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (!autoRefresh) {
      setIsLoading(false);
      return;
    }

    try {
      const q = collection(db, "submissions");
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;

          if (!snapshot.empty) {
            const data: Submission[] = snapshot.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id.startsWith("NV-") ? doc.id : `NV-${doc.id.slice(0, 6).toUpperCase()}`,
                text: d.text || "",
                language: d.language || "English",
                category: (d.category as ComplaintCategory) || "roads",
                urgency: (d.urgency as 1 | 2 | 3 | 4 | 5) || 3,
                summary_english: d.summary_english || d.text || "",
                district: d.district || "",
                state: d.state || "",
                country: d.country || "India",
                lat: d.lat || 20.5937,
                lng: d.lng || 78.9629,
                photo_url: d.photo_url || undefined,
                created_at: d.created_at ? new Date(d.created_at) : new Date(),
                status: d.status || "classified",
              };
            });
            setSubmissions(data);
          } else {
            setSubmissions(ALL_SEED_SUBMISSIONS);
          }
          setIsLoading(false);
        },
        (err) => {
          console.warn("Firestore listener fallback to seed dataset:", err);
          if (isMounted) {
            setSubmissions(ALL_SEED_SUBMISSIONS);
            setIsLoading(false);
          }
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      if (isMounted) {
        setSubmissions(ALL_SEED_SUBMISSIONS);
        setIsLoading(false);
      }
    }
  }, [autoRefresh]);

  // Seed demo data handler
  const handleSeedDemoData = async () => {
    try {
      setToastMessage("Seeding BRICS demo records to Firestore...");
      for (const item of ALL_SEED_SUBMISSIONS.slice(0, 10)) {
        await addDoc(collection(db, "submissions"), {
          text: item.text,
          language: item.language,
          category: item.category,
          urgency: item.urgency,
          summary_english: item.summary_english,
          district: item.district,
          state: item.state,
          country: item.country,
          lat: item.lat,
          lng: item.lng,
          created_at: item.created_at.toISOString(),
          status: item.status,
        });
      }
      setToastMessage("Demo records successfully seeded!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage("Seeded demo records into memory state.");
      setSubmissions((prev) => [...ALL_SEED_SUBMISSIONS, ...prev]);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Filtered table submissions
  const filteredTableSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesSearch =
        tableSearch === "" ||
        item.district.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.summary_english.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.country.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.id.toLowerCase().includes(tableSearch.toLowerCase());

      const matchesCat =
        tableCategory === "all" ||
        item.category.toLowerCase() === tableCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [submissions, tableSearch, tableCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredTableSubmissions.length / itemsPerPage));
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTableSubmissions.slice(start, start + itemsPerPage);
  }, [filteredTableSubmissions, currentPage]);

  if (activeTab === "priority") {
    return <PriorityRankingsView submissions={submissions} />;
  }

  return (
    <div key={activeTab} className="page-transition-enter space-y-6 select-none" id="dashboard-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3 px-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[13px] text-[var(--text-primary)] shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[var(--text-tertiary)] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OVERVIEW TAB: 12-COLUMN BENTO GRID */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Top Row: 4 Stat Cards (span 3 each) */}
          <StatsPanel
            submissions={submissions}
            isLoading={isLoading}
            showBreakdownAndTrend={false}
          />

          {/* Middle Row: Heatmap (span 8) + Priority Panel (span 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <DemandHeatmap
                submissions={submissions}
                isLoading={isLoading}
              />
            </div>
            <div className="lg:col-span-4">
              <PriorityPanel
                submissions={submissions}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Bottom Row: Category Breakdown (span 5) + Trend Mini Chart (span 7) */}
          <StatsPanel
            submissions={submissions}
            isLoading={isLoading}
            showStatCards={false}
            showBreakdownAndTrend={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEATMAP TAB */}
      {/* ========================================================================= */}
      {activeTab === "heatmap" && (
        <div className="space-y-4">
          <DemandHeatmap
            submissions={submissions}
            isLoading={isLoading}
          />
          <StatsPanel
            submissions={submissions}
            isLoading={isLoading}
            showBreakdownAndTrend={false}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BRICS VIEW TAB */}
      {/* ========================================================================= */}
      {activeTab === "brics" && (
        <div className="space-y-4">
          <BRICSComparison
            submissions={submissions}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ALL REPORTS TABLE TAB (LINEAR-INSPIRED) */}
      {/* ========================================================================= */}
      {activeTab === "reports" && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] overflow-hidden card-hover-lift hover:border-[var(--border-base)]">
          {/* SEARCH BAR & CONTROLS ABOVE TABLE */}
          <div className="p-4 border-b border-[var(--border-dim)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-surface)]">
            {/* Search Input (280px width) */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by district, category..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 pl-9 pr-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>

            {/* Right side: category filter dropdown + "Showing {n} of {total}" in grey small */}
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <select
                value={tableCategory}
                onChange={(e) => {
                  setTableCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
              >
                <option value="all">All Sectors</option>
                <option value="roads">Roads</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="sanitation">Sanitation</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
              </select>

              <span className="text-[12px] text-[var(--text-tertiary)] font-mono whitespace-nowrap">
                Showing {paginatedSubmissions.length} of {filteredTableSubmissions.length}
              </span>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              {/* Header: 12px uppercase, var(--text-tertiary), border-bottom: 1px solid var(--border-base) */}
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-subtle)] text-[12px] uppercase font-bold tracking-[0.06em] text-[var(--text-tertiary)]">
                  <th className="py-2.5 px-4 w-[100px]">ID</th>
                  <th className="py-2.5 px-4 w-[120px]">Category</th>
                  <th className="py-2.5 px-4 w-[140px]">District</th>
                  <th className="py-2.5 px-4 w-[80px]">Country</th>
                  <th className="py-2.5 px-4 w-[80px]">Urgency</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Summary</th>
                  <th className="py-2.5 px-4 w-[80px] text-right">Time</th>
                </tr>
              </thead>

              {/* Body: Row height: 44px, Row border-bottom: 1px solid var(--border-dim) */}
              <tbody className="divide-y divide-[var(--border-dim)]">
                {isLoading && submissions.length === 0 ? (
                  /* 10. Table Skeleton: actual table rows with grey cell rectangles */
                  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <tr key={i} className="h-[44px] skeleton-shimmer">
                      <td className="py-2.5 px-4">
                        <div className="w-16 h-3 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-20 h-4 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-24 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-12 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-8 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-48 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="w-10 h-3 bg-[var(--border-base)] rounded-[3px] ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)] text-[13px]">
                      No reports match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((row) => {
                    const isSelected = selectedRowId === row.id;
                    const urgencyVal = Number(row.urgency) || 3;
                    const urgencyDotColor =
                      urgencyVal >= 4
                        ? "bg-[var(--red)]"
                        : urgencyVal === 3
                        ? "bg-[var(--amber)]"
                        : "bg-[var(--green)]";

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowId(isSelected ? null : row.id)}
                        className={`h-[44px] transition-colors cursor-pointer select-none ${
                          isSelected
                            ? "bg-[var(--brand-subtle)] border-l-2 border-[var(--brand-primary)]"
                            : "hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        {/* ID: 100px mono */}
                        <td className="py-2 px-4 font-mono text-[12px] font-semibold text-[var(--brand-secondary)] w-[100px] truncate">
                          {row.id}
                        </td>

                        {/* Category: 120px */}
                        <td className="py-2 px-4 w-[120px]">
                          <Badge
                            variant="outline"
                            className="text-[11px] uppercase font-bold px-1.5 py-0 rounded-[3px] border-[var(--border-base)] truncate"
                            style={{
                              color: `var(--cat-${row.category.toLowerCase()})`,
                            }}
                          >
                            {row.category}
                          </Badge>
                        </td>

                        {/* District: 140px */}
                        <td className="py-2 px-4 text-[13px] font-medium text-[var(--text-primary)] w-[140px] truncate">
                          {row.district}
                        </td>

                        {/* Country: 80px */}
                        <td className="py-2 px-4 text-[13px] text-[var(--text-secondary)] w-[80px] truncate">
                          {row.country}
                        </td>

                        {/* Urgency: 80px (Coloured dot + number) */}
                        <td className="py-2 px-4 w-[80px]">
                          <div className="flex items-center gap-1.5 font-mono text-[12px]">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${urgencyDotColor}`} />
                            <span className="text-[var(--text-primary)] font-semibold">{urgencyVal}</span>
                          </div>
                        </td>

                        {/* Summary: flex */}
                        <td className="py-2 px-4 text-[13px] text-[var(--text-secondary)] truncate max-w-[320px]">
                          {row.summary_english || row.text}
                        </td>

                        {/* Time: 80px relative */}
                        <td className="py-2 px-4 text-[12px] text-[var(--text-tertiary)] font-mono text-right w-[80px] truncate">
                          {formatRelativeTime(row.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR */}
          <div className="p-3 px-4 border-t border-[var(--border-dim)] flex items-center justify-between bg-[var(--bg-subtle)]">
            <span className="text-[12px] text-[var(--text-tertiary)] font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 text-[12px] text-[var(--text-secondary)] cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 text-[12px] text-[var(--text-secondary)] cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYSTEM SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-4 max-w-4xl">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] p-6 space-y-6 card-hover-lift hover:border-[var(--border-base)]">
            <div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] tracking-tight">
                NagarVaani Intelligence Core
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Configure runtime models, telemetry channels, and cross-border synchronization parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gemini Configuration */}
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-dim)] space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--brand-secondary)]" />
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Gemini AI Model
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)] font-mono">
                  models/gemini-3.7-flash
                </div>
                <span className="inline-block text-[11px] font-semibold text-[var(--green)] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-[3px]">
                  Active & Operational
                </span>
              </div>

              {/* Database Status */}
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-dim)] space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--cat-water)]" />
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Persistence Layer
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)] font-mono">
                  Firebase Firestore ({autoRefresh ? "Realtime Stream" : "Paused Snapshot"})
                </div>
                {autoRefresh ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--green)] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-[3px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                    Connected • Live Stream
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--amber)] bg-[rgba(245,158,11,0.1)] px-2 py-0.5 rounded-[3px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
                    Paused • Manual Snapshot Mode
                  </span>
                )}
              </div>
            </div>

            {/* AUTO-REFRESH FIRESTORE LISTENER TOGGLE SWITCH */}
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]/60 border border-[var(--border-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {autoRefresh ? (
                    <Radio className="w-4 h-4 text-[var(--green)] animate-pulse shrink-0" />
                  ) : (
                    <PauseCircle className="w-4 h-4 text-[var(--amber)] shrink-0" />
                  )}
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Firestore Auto-Refresh & Live Telemetry
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono px-1.5 py-0 ${
                      autoRefresh
                        ? "border-[var(--green)] text-[var(--green)]"
                        : "border-[var(--amber)] text-[var(--amber)]"
                    }`}
                  >
                    {autoRefresh ? "Live Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-xl">
                  Enables real-time websocket snapshot listener for civic submissions. Disable to pause live UI re-renders and freeze data during analysis or policymaker review sessions.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                  {autoRefresh ? "Enabled" : "Disabled"}
                </span>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoRefresh}
                  onClick={handleToggleAutoRefresh}
                  id="toggle-firestore-auto-refresh"
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                    autoRefresh
                      ? "bg-[var(--brand-primary)] justify-end"
                      : "bg-[var(--bg-surface)] border border-[var(--border-strong)] justify-start"
                  }`}
                  aria-label="Toggle Firestore Auto-Refresh"
                >
                  <span
                    className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                      autoRefresh
                        ? "bg-white shadow-xs"
                        : "bg-[var(--text-tertiary)]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border-dim)] flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-secondary)]">
                Load sample infrastructure incidents across India, Brazil, Russia, S. Africa, China
              </span>
              <button
                type="button"
                onClick={handleSeedDemoData}
                className="h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[12px] font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                🌱 Seed Demo Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
