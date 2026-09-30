'use client';

import React, { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import PriorityPanel from "@/components/dashboard/PriorityPanel";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { buildStatusHistoryEntry, appendStatusHistory } from "@/lib/audit";
import { isDemoMode } from "@/lib/appMode";
import {
  Search,
  CheckCircle2,
  X,
  Database,
  Cpu,
  RefreshCw,
  Radio,
  PauseCircle,
  MoreHorizontal,
  Copy,
  Check,
  Flag,
  Building2,
} from "lucide-react";

const StatsPanel = lazy(() => import("@/components/dashboard/StatsPanel"));
const DemandHeatmap = lazy(() => import("@/components/dashboard/DemandHeatmap"));
const PriorityRankingsView = lazy(() => import("@/components/dashboard/PriorityRankingsView"));
const BRICSComparison = lazy(() => import("@/components/dashboard/BRICSComparison"));
const DepartmentView = lazy(() => import("@/components/dashboard/DepartmentView"));

function DashboardPanelFallback() {
  return (
    <div className="min-h-[180px] rounded-[var(--radius-md)] border border-[var(--border-dim)] bg-[var(--bg-surface)] animate-pulse" />
  );
}

export type DashboardTab = "overview" | "heatmap" | "brics" | "reports" | "settings" | "priority" | "departments";

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
  selectedTimeRange = "30d",
}: {
  activeTab?: DashboardTab;
  onSelectTab?: (tab: any) => void;
  selectedTimeRange?: "today" | "7d" | "30d" | "90d" | "all";
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

  // Bulk action selections and action menu dropdown
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenActionRowId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // 1. Filtered, cursor-paginated backend intake (active when autoRefresh is true)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (!autoRefresh) {
      setIsLoading(false);
      return;
    }

    const loadSubmissions = async () => {
      try {
        const endpoint = isDemoMode() ? "/api/demo/submissions" : "/api/admin/submissions?limit=100";
        const token = sessionStorage.getItem("nv_dashboard_token");
        const response = await fetch(endpoint, {
          headers: !isDemoMode() && token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error("Submission query failed");
        const payload = await response.json();
        const data: Submission[] = (payload.submissions || []).map((d: any) => ({
          id: d.id || (d.firestoreId && String(d.firestoreId).startsWith("NV-") ? d.firestoreId : `NV-${String(d.firestoreId || "000000").slice(0, 6).toUpperCase()}`),
          firestoreId: d.firestoreId || d.id,
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
          status: (d.status as Submission["status"]) || "classified",
          classified_by: d.classified_by,
          confidence: d.confidence,
          upvotes: Number(d.upvotes) || 0,
          department_id: d.department_id || undefined,
          department_name: d.department_name || undefined,
          sla_deadline: d.sla_deadline || undefined,
          sla_status: d.sla_status || undefined,
          status_history: Array.isArray(d.status_history) ? d.status_history : [],
        }));
        if (isMounted) setSubmissions(data.length > 0 ? data : ALL_SEED_SUBMISSIONS);
      } catch (error) {
        console.warn("Backend submission query fallback to seed dataset:", error);
        if (isMounted) setSubmissions(ALL_SEED_SUBMISSIONS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadSubmissions();
    return () => {
      isMounted = false;
    };
  }, [autoRefresh]);

  // Single status update handler
  const handleUpdateStatus = async (
    row: Submission,
    newStatus: Submission["status"],
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setOpenActionRowId(null);

    const statusDisplayMap: Record<string, string> = {
      pending: "Pending",
      classified: "Classified",
      acknowledged: "Acknowledged",
      in_progress: "In Progress",
      resolved: "Resolved",
      priority: "Priority",
    };

    const nextHistory = appendStatusHistory(
      row.status_history,
      buildStatusHistoryEntry(row.status, newStatus, {
        note: `Status changed to ${statusDisplayMap[newStatus] || newStatus}`,
      })
    );

    // Instant local state update for real-time reactivity
    setSubmissions((prev) =>
      prev.map((s) => (s.id === row.id ? { ...s, status: newStatus, status_history: nextHistory } : s))
    );

    setToastMessage(`Updated to: ${statusDisplayMap[newStatus] || newStatus}`);
    setTimeout(() => setToastMessage(null), 3000);

    // Read-only in demo mode: do not call /api/admin endpoints
    if (isDemoMode()) {
      return;
    }

    // Update Firestore document status field
    try {
      const docId = row.firestoreId || (row.id && !row.id.startsWith("seed-") ? row.id : null);
      if (docId) {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("nv_dashboard_token") : null;
        const response = await fetch(`/api/admin/submissions/${encodeURIComponent(docId)}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            status: newStatus,
            note: `Status changed to ${statusDisplayMap[newStatus] || newStatus}`,
          }),
        });
        if (!response.ok) throw new Error("Status update request failed");
      }
    } catch (err) {
      console.warn("Could not persist status update to Firestore:", err);
      setSubmissions((prev) =>
        prev.map((submission) => (submission.id === row.id ? row : submission))
      );
      setToastMessage("Status update could not be saved. The previous status was restored.");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Copy tracking ID handler
  const handleCopyTrackingId = (id?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenActionRowId(null);
    if (!id) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
    setToastMessage(`Copied tracking ID: ${id}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRetryClassification = async (row: Submission, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenActionRowId(null);
    if (isDemoMode()) {
      setToastMessage("Read-only in demo sandbox mode.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const docId = row.firestoreId || row.id;
    if (!docId) return;
    try {
      const token = sessionStorage.getItem("nv_dashboard_token");
      const response = await fetch(`/api/admin/submissions/${encodeURIComponent(docId)}/reclassify`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Classification retry failed");
      setSubmissions((prev) => prev.map((item) => item.id === row.id ? { ...item, status: "pending" } : item));
      setToastMessage("Classification retry queued.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage("Classification retry could not be queued.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Bulk status update handler
  const handleBulkUpdateStatus = async (newStatus: Submission["status"]) => {
    const idsToUpdate = [...selectedRowIds];
    const count = idsToUpdate.length;
    if (count === 0) return;

    const statusDisplayMap: Record<string, string> = {
      pending: "Pending",
      classified: "Classified",
      acknowledged: "Acknowledged",
      in_progress: "In Progress",
      resolved: "Resolved",
      priority: "Priority",
    };

    const nextHistoryForRows = submissions
      .filter((s) => idsToUpdate.includes(s.id || ""))
      .map((s) => ({
        rowId: s.id,
        history: appendStatusHistory(
          s.status_history,
          buildStatusHistoryEntry(s.status, newStatus, {
            note: `Bulk status update: ${statusDisplayMap[newStatus] || newStatus}`,
          })
        ),
      }));

    // 1. Instant local state update
    setSubmissions((prev) =>
      prev.map((s) => {
        const matching = nextHistoryForRows.find((item) => item.rowId === s.id);
        return matching && idsToUpdate.includes(s.id || "") ? { ...s, status: newStatus, status_history: matching.history } : s;
      })
    );
    setSelectedRowIds([]);
    setToastMessage(`Updated ${count} reports to: ${statusDisplayMap[newStatus] || newStatus}`);
    setTimeout(() => setToastMessage(null), 3000);

    // 2. Update Firestore documents (skip in demo mode)
    if (isDemoMode()) {
      return;
    }
    try {
      const selectedSubs = submissions.filter((s) => idsToUpdate.includes(s.id || ""));
      const promises = selectedSubs.map((sub) => {
        const docId = sub.firestoreId || (sub.id && !sub.id.startsWith("seed-") ? sub.id : null);
        if (docId) {
          const token = typeof window !== "undefined" ? sessionStorage.getItem("nv_dashboard_token") : null;
          return fetch(`/api/admin/submissions/${encodeURIComponent(docId)}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              status: newStatus,
              note: `Bulk update to ${statusDisplayMap[newStatus] || newStatus}`,
            }),
          }).then((response) => {
            if (!response.ok) throw new Error("Status update request failed");
          }).catch((err) => {
            console.warn("Doc update failed for", docId, err);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (err) {
      console.warn("Bulk Firestore update error:", err);
    }
  };

  // Seed demo data handler
  const handleSeedDemoData = async () => {
    if (isDemoMode()) {
      setToastMessage("Demo sandbox already includes 60 pre-seeded records.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      setToastMessage("Seeding BRICS demo records to Firestore...");
      const token = sessionStorage.getItem("nv_dashboard_token");
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Seed request failed");
      setToastMessage("Demo records successfully seeded!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage("Seeded demo records into memory state.");
      setSubmissions((prev) => [...ALL_SEED_SUBMISSIONS, ...prev]);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // PART 1 — Time-based global filter logic
  const filteredSubmissions = useMemo(() => {
    if (!selectedTimeRange || selectedTimeRange === "all") return submissions;
    const cutoff = new Date();
    if (selectedTimeRange === "today") {
      cutoff.setHours(0, 0, 0, 0);
    } else {
      const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
      cutoff.setDate(cutoff.getDate() - (days[selectedTimeRange] || 30));
    }
    return submissions.filter((s) => {
      if (!s.created_at) return false;
      const d = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
      if (isNaN(d.getTime())) return true;
      return d >= cutoff;
    });
  }, [submissions, selectedTimeRange]);

  // Navigate to reports filtered by district and category
  const handleNavigateToReportsFiltered = (district: string, category: string) => {
    setTableSearch(district);
    setTableCategory(category);
    setCurrentPage(1);
    if (onSelectTab) {
      onSelectTab("reports");
    }
  };

  // Filtered table submissions
  const filteredTableSubmissions = useMemo(() => {
    return filteredSubmissions.filter((item) => {
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
  }, [filteredSubmissions, tableSearch, tableCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredTableSubmissions.length / itemsPerPage));
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTableSubmissions.slice(start, start + itemsPerPage);
  }, [filteredTableSubmissions, currentPage]);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedRowId) || null,
    [submissions, selectedRowId]
  );

  if (activeTab === "priority") {
    return (
      <Suspense fallback={<DashboardPanelFallback />}>
        <PriorityRankingsView submissions={filteredSubmissions} />
      </Suspense>
    );
  }

  if (activeTab === "departments") {
    return (
      <Suspense fallback={<DashboardPanelFallback />}>
        <DepartmentView
          submissions={filteredSubmissions}
          onNavigateToReports={(category, filterTerm) => {
            handleNavigateToReportsFiltered(filterTerm || "", category || "all");
          }}
          onSelectTab={onSelectTab}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<DashboardPanelFallback />}>
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
            submissions={filteredSubmissions}
            allSubmissions={submissions}
            timeRange={selectedTimeRange}
            isLoading={isLoading}
            showBreakdownAndTrend={false}
          />

          {/* Middle Row: Heatmap (span 8) + Priority Panel (span 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <DemandHeatmap
                submissions={filteredSubmissions}
                isLoading={isLoading}
              />
            </div>
            <div className="lg:col-span-4">
              <PriorityPanel
                submissions={filteredSubmissions}
                allSubmissions={submissions}
                isLoading={isLoading}
                onNavigateToReports={handleNavigateToReportsFiltered}
              />
            </div>
          </div>

          {/* Bottom Row: Category Breakdown (span 5) + Trend Mini Chart (span 7) */}
          <StatsPanel
            submissions={filteredSubmissions}
            allSubmissions={submissions}
            timeRange={selectedTimeRange}
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
            submissions={filteredSubmissions}
            isLoading={isLoading}
          />
          <StatsPanel
            submissions={filteredSubmissions}
            allSubmissions={submissions}
            timeRange={selectedTimeRange}
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
            submissions={filteredSubmissions}
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

          {/* DEMO DATA BANNER */}
          {submissions.some((s) => s.synthetic) && (
            <div className="mx-4 mt-3 p-3 rounded-[var(--radius-sm)] bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-[12px] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-100 text-[10px] font-bold uppercase tracking-wider">
                  Demo data
                </span>
                <span>
                  Records marked with the <strong>Demo</strong> tag are synthetic demonstration grievances illustrating multilingual intake across 20+ Indian states and NITI Aayog aspirational districts.
                </span>
              </div>
              <span className="text-[11px] font-mono opacity-80 shrink-0">
                {submissions.filter((s) => s.synthetic).length} synthetic records
              </span>
            </div>
          )}

          {/* PART 2 — BULK ACTIONS FLOATING TOOLBAR */}
          {selectedRowIds.length > 0 && (
            <div className="mx-4 mt-3 mb-1 p-2.5 px-4 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/40 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                <span className="text-[13px] font-semibold text-[var(--text-primary)] font-mono">
                  {selectedRowIds.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkUpdateStatus("acknowledged")}
                  className="h-7 px-3 rounded-[var(--radius-sm)] bg-[rgba(245,158,11,0.15)] hover:bg-[rgba(245,158,11,0.25)] text-[#fbbf24] border border-[rgba(245,158,11,0.3)] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>✅</span>
                  <span>Mark Acknowledged</span>
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus("resolved")}
                  className="h-7 px-3 rounded-[var(--radius-sm)] bg-[rgba(34,197,94,0.15)] hover:bg-[rgba(34,197,94,0.25)] text-[#4ade80] border border-[rgba(34,197,94,0.3)] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>✔️</span>
                  <span>Mark Resolved</span>
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus("priority")}
                  className="h-7 px-3 rounded-[var(--radius-sm)] bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#f87171] border border-[rgba(239,68,68,0.3)] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🚩</span>
                  <span>Flag Priority</span>
                </button>
                <button
                  onClick={() => setSelectedRowIds([])}
                  className="h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border-base)] text-[12px] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              {/* Header */}
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-subtle)] text-[12px] uppercase font-bold tracking-[0.06em] text-[var(--text-tertiary)]">
                  {/* Leftmost checkbox column: 36px */}
                  <th className="py-2.5 px-3 w-[36px] text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedSubmissions.length > 0 &&
                        paginatedSubmissions.every((s) => selectedRowIds.includes(s.id || ""))
                      }
                      onChange={(e) => {
                        e.stopPropagation();
                        const allPageSelected =
                          paginatedSubmissions.length > 0 &&
                          paginatedSubmissions.every((s) => selectedRowIds.includes(s.id || ""));
                        if (allPageSelected) {
                          const pageIds = new Set(paginatedSubmissions.map((s) => s.id || ""));
                          setSelectedRowIds((prev) => prev.filter((id) => !pageIds.has(id)));
                        } else {
                          const pageIds = paginatedSubmissions.map((s) => s.id || "");
                          setSelectedRowIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                        }
                      }}
                      className="rounded accent-[var(--brand-primary)] w-3.5 h-3.5 cursor-pointer align-middle"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-[95px]">ID</th>
                  <th className="py-2.5 px-3 w-[110px]">Category</th>
                  <th className="py-2.5 px-3 w-[130px]">District</th>
                  <th className="py-2.5 px-3 w-[80px]">Country</th>
                  <th className="py-2.5 px-3 w-[80px]">Urgency</th>
                  {/* Status column between Urgency and Summary */}
                  <th className="py-2.5 px-3 w-[120px]">Status</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Summary</th>
                  <th className="py-2.5 px-3 w-[80px] text-right">Time</th>
                  {/* Actions column (last column, 100px wide) */}
                  <th className="py-2.5 px-3 w-[100px] text-center">Actions</th>
                </tr>
              </thead>

              {/* Body: Row height: 44px, Row border-bottom: 1px solid var(--border-dim) */}
              <tbody className="divide-y divide-[var(--border-dim)]">
                {isLoading && submissions.length === 0 ? (
                  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <tr key={i} className="h-[44px] skeleton-shimmer">
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-3.5 h-3.5 bg-[var(--border-base)] rounded-[3px] mx-auto" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-16 h-3 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-20 h-4 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-24 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-12 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-8 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-20 h-4 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-48 h-3.5 bg-[var(--border-base)] rounded-[3px]" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="w-10 h-3 bg-[var(--border-base)] rounded-[3px] ml-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-6 h-6 bg-[var(--border-base)] rounded-[3px] mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[var(--text-secondary)] text-[13px]">
                      No reports match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((row) => {
                    const isSelected = selectedRowId === row.id;
                    const isChecked = selectedRowIds.includes(row.id || "");
                    const isActionOpen = openActionRowId === row.id;
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
                        onClick={() => setSelectedRowId(isSelected ? null : (row.id || null))}
                        className={`h-[44px] transition-colors cursor-pointer select-none ${
                          isSelected
                            ? "bg-[var(--brand-subtle)] border-l-2 border-[var(--brand-primary)]"
                            : isChecked
                            ? "bg-[rgba(99,102,241,0.06)]"
                            : "hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        {/* Checkbox column (20px / 36px wide) */}
                        <td
                          className="py-2 px-3 w-[36px] text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              const id = row.id || "";
                              setSelectedRowIds((prev) =>
                                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                              );
                            }}
                            className="rounded accent-[var(--brand-primary)] w-3.5 h-3.5 cursor-pointer align-middle"
                          />
                        </td>

                        {/* ID: 95px mono */}
                        <td className="py-2 px-3 font-mono text-[12px] font-semibold text-[var(--brand-secondary)] w-[95px] truncate">
                          <div className="flex flex-col items-start gap-0.5">
                            <span>{row.id}</span>
                            {row.synthetic && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                                Demo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category: 110px */}
                        <td className="py-2 px-3 w-[110px]">
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

                        {/* District: 130px */}
                        <td className="py-2 px-3 text-[13px] font-medium text-[var(--text-primary)] w-[130px] truncate">
                          {row.district}
                        </td>

                        {/* Country: 80px */}
                        <td className="py-2 px-3 text-[13px] text-[var(--text-secondary)] w-[80px] truncate">
                          {row.country}
                        </td>

                        {/* Urgency: 80px (Coloured dot + number) */}
                        <td className="py-2 px-3 w-[80px]">
                          <div className="flex items-center gap-1.5 font-mono text-[12px]">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${urgencyDotColor}`} />
                            <span className="text-[var(--text-primary)] font-semibold">{urgencyVal}</span>
                          </div>
                        </td>

                        {/* Status: 120px (Between Urgency and Summary) */}
                        <td className="py-2 px-3 w-[120px]">
                          {row.status === "pending" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(156,163,175,0.12)] text-[#9ca3af] border border-[rgba(156,163,175,0.25)]">
                              Pending
                            </span>
                          )}
                          {row.status === "classification_failed" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.25)]">
                              Classification Failed
                            </span>
                          )}
                          {row.status === "acknowledged" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(245,158,11,0.12)] text-[#fbbf24] border border-[rgba(245,158,11,0.25)]">
                              Acknowledged
                            </span>
                          )}
                          {row.status === "in_progress" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(99,102,241,0.12)] text-[#818cf8] border border-[rgba(99,102,241,0.25)]">
                              In Progress
                            </span>
                          )}
                          {row.status === "resolved" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(34,197,94,0.12)] text-[#4ade80] border border-[rgba(34,197,94,0.25)]">
                              Resolved
                            </span>
                          )}
                          {row.status === "priority" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.25)]">
                              <span>🚩</span>
                              <span>Priority</span>
                            </span>
                          )}
                          {(row.status === "classified" || !row.status) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.06em] bg-[rgba(59,130,246,0.12)] text-[#60a5fa] border border-[rgba(59,130,246,0.25)]">
                              Classified
                            </span>
                          )}
                          {row.classified_by && (
                            <span className="ml-1 inline-flex items-center rounded-[4px] border border-[var(--border-dim)] px-1 py-0.5 text-[9px] text-[var(--text-tertiary)]">
                              {row.classified_by === "gemini" ? "AI-classified" : "Auto-sorted (offline mode)"}
                            </span>
                          )}
                        </td>

                        {/* Summary: flex */}
                        <td className="py-2 px-3 text-[13px] text-[var(--text-secondary)] truncate max-w-[280px]">
                          {row.summary_english || row.text}
                        </td>

                        {/* Time: 80px relative */}
                        <td className="py-2 px-3 text-[12px] text-[var(--text-tertiary)] font-mono text-right w-[80px] truncate">
                          {formatRelativeTime(row.created_at)}
                        </td>

                        {/* PART 1: Actions column (last column, 100px wide) */}
                        <td
                          className="py-2 px-3 w-[100px] text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionRowId(isActionOpen ? null : (row.id || null));
                              }}
                              className="w-7 h-7 rounded-[4px] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-[var(--border-dim)]"
                              title="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isActionOpen && (
                              <div
                                className="absolute right-0 top-full mt-1 w-48 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl z-50 py-1 text-[12px] animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleUpdateStatus(row, "acknowledged", e)}
                                  className="w-full px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <span>✅</span>
                                  <span>Mark Acknowledged</span>
                                </button>
                                <button
                                  onClick={(e) => handleUpdateStatus(row, "in_progress", e)}
                                  className="w-full px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <span>🔄</span>
                                  <span>Mark In Progress</span>
                                </button>
                                <button
                                  onClick={(e) => handleUpdateStatus(row, "resolved", e)}
                                  className="w-full px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <span>✔️</span>
                                  <span>Mark Resolved</span>
                                </button>
                                <button
                                  onClick={(e) => handleUpdateStatus(row, "priority", e)}
                                  className="w-full px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <span>🚩</span>
                                  <span>Flag as Priority</span>
                                </button>
                                {row.status === "classification_failed" && sessionStorage.getItem("nv_dashboard_role") === "operator" && (
                                  <button
                                    onClick={(e) => handleRetryClassification(row, e)}
                                    className="w-full px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <span>↻</span>
                                    <span>Retry Classification</span>
                                  </button>
                                )}
                                <div className="my-1 border-t border-[var(--border-dim)]" />
                                <button
                                  onClick={(e) => handleCopyTrackingId(row.id, e)}
                                  className="w-full px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <span>📋</span>
                                  <span>Copy Tracking ID</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {selectedSubmission && (
            <section className="border-t border-[var(--border-dim)] bg-[var(--bg-subtle)] p-5 space-y-4" aria-label="Complaint telemetry and detail">
              {/* Header with Title and Demo Tag */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[var(--border-dim)]">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-bold">Complaint Telemetry & Detail</p>
                    {selectedSubmission.synthetic && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                        Demo Data (Synthetic)
                      </span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] font-mono mt-0.5">{selectedSubmission.id}</h3>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">{selectedSubmission.district}, {selectedSubmission.state} ({selectedSubmission.country})</span>
                  <span>•</span>
                  <span>{selectedSubmission.status_history?.length || 0} recorded transition{selectedSubmission.status_history?.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              {/* Multilingual Complaint Text View (Both Original and English Translation) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Text */}
                <div className="p-3.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-[var(--bg-surface)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--brand-primary)]">
                      Original Citizen Voice / Text
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-dim)]">
                      {selectedSubmission.detected_language || selectedSubmission.language || "Native"}
                    </span>
                  </div>
                  <p className="text-[14px] text-[var(--text-primary)] leading-relaxed font-medium">
                    "{selectedSubmission.original_text || selectedSubmission.text}"
                  </p>
                </div>

                {/* English Translation */}
                <div className="p-3.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-[var(--bg-surface)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-600 dark:text-emerald-400">
                      Standardized English Translation
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-dim)]">
                      English
                    </span>
                  </div>
                  <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">
                    "{selectedSubmission.english_translation || selectedSubmission.summary_english || selectedSubmission.text}"
                  </p>
                </div>
              </div>

              {/* Status History Transitions */}
              <div className="pt-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-bold mb-2">Resolution Lifecycle Audit</p>
                {selectedSubmission.status_history && selectedSubmission.status_history.length > 0 ? (
                  <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedSubmission.status_history.map((entry, index) => (
                      <li key={`${entry.timestamp}-${index}`} className="rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-[var(--bg-surface)] p-3">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-tertiary)]">
                          <time dateTime={entry.timestamp}>{formatRelativeTime(entry.timestamp)}</time>
                          <span className="uppercase tracking-[0.06em]">{entry.changedBy}</span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium text-[var(--text-primary)]">
                          {entry.previousStatus} <span className="text-[var(--text-tertiary)]">to</span> {entry.newStatus}
                        </p>
                        {entry.note && <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{entry.note}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-[12px] text-[var(--text-secondary)]">No status transitions have been recorded for this complaint.</p>
                )}
              </div>
            </section>
          )}

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
                  Gemini Flash
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

            {/* THEME & APPEARANCE SWITCH */}
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]/60 border border-[var(--border-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Interface Theme & Appearance
                </span>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-xl">
                  Toggle between high-contrast dark room mode and clean daylight mode across both the executive analytics dashboard and citizen interface.
                </p>
              </div>

              <div className="shrink-0">
                <ThemeToggle variant="switch" id="settings-theme-toggle" />
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
    </Suspense>
  );
}
