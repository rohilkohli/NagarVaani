'use client';

import React, { lazy, Suspense, useState, useEffect } from "react";
import Sidebar, { NavTab } from "@/components/shared/Sidebar";
import Header, { TimeRange } from "@/components/shared/Header";
import AdminGate from "@/components/shared/AdminGate";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useTheme } from "@/lib/themeContext";
import { Submission, ComplaintCategory } from "@/lib/types";
import { getRuntimeMode, isDemoMode } from "@/lib/appMode";
import BrandMark from "@/components/shared/BrandMark";

const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const CitizenPage = lazy(() => import("./pages/CitizenPage.tsx"));
const TrackComplaint = lazy(() => import("@/components/citizen/TrackComplaint"));

function RouteFallback() {
  return (
    <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-8 space-y-4" role="status" aria-label="Loading view">
      <div className="h-7 w-2/3 skeleton-shimmer rounded-[var(--radius-md)]" />
      <div className="h-4 w-1/2 skeleton-shimmer rounded-[var(--radius-md)]" />
      <div className="h-44 w-full skeleton-shimmer rounded-[var(--radius-md)]" />
      <div className="h-12 w-full skeleton-shimmer rounded-[var(--radius-md)]" />
    </div>
  );
}

export default function App() {
  const { theme } = useTheme();
  const [liveSubmissions, setLiveSubmissions] = useState<Submission[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("track") || "NV-849201";
    }
    return "NV-849201";
  });

  const DEMO = isDemoMode();

  // In demo mode show a landing selector before any view
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hasTrack = new URLSearchParams(window.location.search).get("track");
      // Skip landing if navigating directly to a specific path
      if (hasTrack || path === "/citizen" || path === "/dashboard") return false;
    }
    return DEMO && window.location.pathname === "/";
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const trackId = urlParams.get("track");
      if (trackId) return "track";

      const path = window.location.pathname;
      if (path === "/track") return "track";
      if (path === "/dashboard") return "overview";
      if (path === "/heatmap") return "heatmap";
      if (path === "/priority") return "priority";
      if (path === "/brics") return "brics";
      if (path === "/reports") return "reports";
      if (path === "/settings") return "settings";
      if (path === "/citizen") return "citizen";
      return "citizen"; // Default to citizen portal on home route
    }
    return "citizen";
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("30d");

  // Detect online/offline status & PWA install prompt
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = localStorage.getItem("nv_install_dismissed");
      if (!dismissed) setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Sync tab with browser URL history
  const handleSelectTab = (tab: NavTab, specificTrackId?: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      if (tab === "track") {
        const idToUse = specificTrackId || currentTrackId;
        window.history.pushState({}, "", `/?track=${encodeURIComponent(idToUse)}`);
      } else {
        const path = tab === "citizen" ? "/citizen" : tab === "overview" ? "/dashboard" : `/${tab}`;
        window.history.pushState({}, "", path);
      }
    }
  };

  const handleSeedData = async () => {
    if (isDemoMode()) {
      setToastMsg("⚠️ Demo mode is active. Configure live Firebase credentials before seeding live data.");
      setTimeout(() => setToastMsg(null), 5000);
      return;
    }

    const token = sessionStorage.getItem("nv_dashboard_token");
    const response = await fetch("/api/admin/seed", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error("Seed request failed");
    }
  };

  const handleResetDemo = async () => {
    if (isDemoMode()) {
      setToastMsg("⚠️ Demo mode is active. Configure Firebase before seeding live data.");
      setTimeout(() => setToastMsg(null), 5000);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem('nv_seeded');
      }
      await handleSeedData();
      if (typeof window !== "undefined") {
        localStorage.setItem('nv_seeded', 'true');
      }
      setToastMsg("✅ 60 demo submissions loaded across 5 BRICS nations");
      setTimeout(() => setToastMsg(null), 5000);
    } catch (e) {
      console.error("Error refreshing demo data:", e);
    }
  };

  // Real-time Firestore sync
  useEffect(() => {
    if (isDemoMode()) {
      setLiveSubmissions([]);
      return;
    }

    try {
      const unsubscribe = onSnapshot(
        collection(db, "submissions"),
        (snapshot) => {
          if (!snapshot.empty) {
            const data: Submission[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: d.id || `NV-${docSnap.id.slice(0, 6).toUpperCase()}`,
                firestoreId: docSnap.id,
                text: d.text || "",
                language: d.language || "English",
                category: (d.category as ComplaintCategory) || "roads",
                urgency: (d.urgency as 1 | 2 | 3 | 4 | 5) || 3,
                summary_english: d.summary_english || d.text || "",
                district: d.district || "District",
                state: d.state || "",
                country: d.country || "India",
                lat: d.lat || 20.5937,
                lng: d.lng || 78.9629,
                photo_url: d.photo_url || undefined,
                created_at: d.created_at ? new Date(d.created_at) : new Date(),
                status: (d.status as Submission["status"]) || "classified",
                status_history: Array.isArray(d.status_history) ? d.status_history : [],
                upvotes: Number(d.upvotes) || 0,
                department_id: d.department_id || undefined,
                department_name: d.department_name || undefined,
                sla_deadline: d.sla_deadline || undefined,
                sla_status: d.sla_status || undefined,
              };
            });
            setLiveSubmissions(data);
          } else {
            setLiveSubmissions([]);
          }
        },
        (err) => {
          console.warn("Notice: Firestore subscription in App:", err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore listener initialization note:", e);
    }
  }, []);

  const handleExportCSV = () => {
    const data = liveSubmissions.length > 0 ? liveSubmissions : ALL_SEED_SUBMISSIONS;

    const headers = [
      'ID', 'Category', 'District', 'State', 'Country',
      'Urgency', 'Summary', 'Language', 'Date', 'Status', 'AuditHistory'
    ];

    const rows = data.map(s => [
      s.id || '',
      s.category,
      s.district,
      s.state,
      s.country,
      s.urgency,
      `"${(s.summary_english || s.text || '').replace(/"/g, "'")}"`,
      s.language,
      s.created_at instanceof Date 
        ? s.created_at.toISOString().split('T')[0]
        : new Date(s.created_at).toISOString().split('T')[0],
      s.status,
      `"${JSON.stringify(s.status_history || []).replace(/"/g, "'")}"`
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nagarvaani-live-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setToastMsg(`📥 Exported ${data.length} live records to CSV`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const trackId = urlParams.get("track");
      if (trackId) {
        setCurrentTrackId(trackId);
        setActiveTab("track");
        return;
      }
      const path = window.location.pathname;
      if (path === "/track") setActiveTab("track");
      else if (path === "/citizen" || path === "/") setActiveTab("citizen");
      else if (path === "/heatmap") setActiveTab("heatmap");
      else if (path === "/priority") setActiveTab("priority");
      else if (path === "/brics") setActiveTab("brics");
      else if (path === "/reports") setActiveTab("reports");
      else if (path === "/settings") setActiveTab("settings");
      else setActiveTab("overview");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // FIX 1 — Auto-seed on first dashboard load
  useEffect(() => {
    if (isDemoMode()) {
      return;
    }

    const hasSeeded = localStorage.getItem('nv_seeded');
    if (!hasSeeded) {
      handleSeedData()
        .then(() => {
          localStorage.setItem('nv_seeded', 'true');
          setToastMsg("✅ 60 demo submissions loaded across 5 BRICS nations");
          setTimeout(() => setToastMsg(null), 5000);
        })
        .catch(() => {
          console.log("Seed will retry on next load when Firebase is configured");
        });
    }
  }, []);

  // Smooth body background transition between citizen portal, tracking, and dashboard with active theme
  useEffect(() => {
    if (theme === 'dark') {
      document.body.style.backgroundColor = '#0a0a0f';
    } else {
      document.body.style.backgroundColor = (activeTab === 'citizen' || activeTab === 'track') ? '#fafaf9' : '#f8fafc';
    }
  }, [activeTab, theme]);

  // Touch gesture handling for mobile drawer (swipe from left edge to open, swipe to close)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Ensure horizontal swipe intent
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        // Swipe right from left edge (within first 40px of screen) to open drawer
        if (deltaX > 0 && touchStartX <= 40 && !isMobileMenuOpen) {
          setIsMobileMenuOpen(true);
        }
        // Swipe on drawer to close (supports both left swipe or right swipe gesture)
        else if (isMobileMenuOpen) {
          if (deltaX < -30 || deltaX > 30) {
            setIsMobileMenuOpen(false);
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobileMenuOpen]);

  // ── Demo mode: landing selector ─────────────────────────────────────────
  if (DEMO && showLanding) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-8 p-6">
        {/* Demo / sandbox badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[12px] font-semibold text-amber-300">Demo / sandbox — no real data</span>
        </div>

        {/* Logo */}
        <div className="text-center">
          <img
            src="/brand/nagarvaani-logo-dark.svg"
            alt=""
            width={460}
            height={138}
            className="mx-auto h-28 sm:h-32 w-auto select-none"
            draggable={false}
          />
          <h1 className="sr-only">NagarVaani</h1>
          <p className="mt-2 text-[var(--text-secondary)] text-[15px] max-w-sm mx-auto">
            Multilingual AI civic infrastructure platform — solving for India, with BRICS extension
          </p>
        </div>

        {/* Two entry-point buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            type="button"
            id="landing-citizen-btn"
            onClick={() => { setShowLanding(false); setActiveTab("citizen"); window.history.pushState({}, "", "/citizen"); }}
            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)] bg-[#111118] border border-[rgba(255,255,255,0.1)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-subtle)] transition-all cursor-pointer text-left group"
          >
            <span className="text-3xl">📣</span>
            <div>
              <div className="font-semibold text-white text-[15px] group-hover:text-[var(--brand-secondary)] transition-colors">Citizen portal</div>
              <div className="text-[13px] text-[var(--text-secondary)] mt-0.5">Submit a complaint · track your report</div>
            </div>
          </button>

          <button
            type="button"
            id="landing-dashboard-btn"
            onClick={() => { setShowLanding(false); setActiveTab("overview"); window.history.pushState({}, "", "/dashboard"); }}
            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)] bg-[#111118] border border-[rgba(255,255,255,0.1)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-subtle)] transition-all cursor-pointer text-left group"
          >
            <span className="text-3xl">📊</span>
            <div>
              <div className="font-semibold text-white text-[15px] group-hover:text-[var(--brand-secondary)] transition-colors">Policymaker dashboard <span className="text-[11px] font-normal text-amber-400">(demo)</span></div>
              <div className="text-[13px] text-[var(--text-secondary)] mt-0.5">Read-only · pre-loaded seed data</div>
            </div>
          </button>
        </div>

        <p className="text-[12px] text-[var(--text-tertiary)] text-center max-w-xs">
          Submissions stay in memory for this session only — nothing is written to Firebase.
        </p>
      </div>
    );
  }

  // 1. CITIZEN PORTAL (Full-width single column, no sidebar, warm light aesthetic)
  if (activeTab === "citizen") {
    return (
      <div className="transition-colors duration-300 min-h-screen flex flex-col">
        {/* Persistent demo sandbox banner */}
        {DEMO && (
          <div className="demo-banner w-full justify-center text-center">
            <span className="pulse-dot" />
            <span>
              <strong>Demo data / sandbox</strong> — submissions stay in memory for this instance only; nothing writes to Firestore or Storage.
            </span>
          </div>
        )}

        {/* Offline banner (show in citizen portal only): */}
        {!isOnline && (
          <div className="w-full bg-amber-500 text-white text-center py-2 px-4 text-[13px] font-medium z-50 sticky top-0 shadow-xs" role="status">
            📡 You're offline. Your complaint will be queued locally and submitted automatically when you reconnect.
          </div>
        )}

        {/* Install banner (show below offline banner): */}
        {showInstallBanner && isOnline && (
          <div className="w-full bg-[#6366f1] text-white flex items-center justify-between px-4 py-2.5 z-40 relative shadow-xs">
            <span className="text-[13px]">
              📲 Add NagarVaani to your home screen for faster access
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  installPrompt?.prompt();
                  setShowInstallBanner(false);
                }}
                className="text-[12px] font-semibold bg-white text-[#6366f1] px-3 py-1 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Install
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("nv_install_dismissed", "1");
                  setShowInstallBanner(false);
                }}
                className="text-[12px] opacity-70 hover:opacity-100 px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <Suspense fallback={<RouteFallback />}>
          <CitizenPage
            onNavigateToDashboard={() => handleSelectTab("overview")}
            onNavigateToTrack={(id) => {
              setCurrentTrackId(id);
              handleSelectTab("track", id);
            }}
          />
        </Suspense>
      </div>
    );
  }

  // 2. COMPLAINT TRACKING VIEW (Full-width single column)
  if (activeTab === "track") {
    return (
      <div className="transition-colors duration-300 min-h-screen bg-[var(--panel-bg)]">
        <Suspense fallback={<RouteFallback />}>
          <TrackComplaint
            trackingId={currentTrackId}
            onNavigateToCitizen={() => handleSelectTab("citizen")}
            onNavigateToDashboard={() => handleSelectTab("overview")}
            onSelectTrackId={(newId) => {
              setCurrentTrackId(newId);
              window.history.pushState({}, "", `/?track=${encodeURIComponent(newId)}`);
            }}
          />
        </Suspense>
      </div>
    );
  }

  // 2. POLICYMAKER DASHBOARD (Dark-first Linear bento grid layout with 220px fixed sidebar)
  const dashboardShell = (
    <div className="transition-colors duration-300 min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex font-sans antialiased selection:bg-[rgba(99,102,241,0.25)] selection:text-white">
      {/* DESKTOP FIXED LEFT SIDEBAR (220px) */}
      <div className="hidden md:block w-[220px] shrink-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onSeedData={handleSeedData}
          onResetDemo={handleResetDemo}
        />
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onTouchStart={(e) => {
            (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
            (e.currentTarget as any)._touchStartY = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchStartX;
            const startY = (e.currentTarget as any)._touchStartY;
            if (typeof startX === 'number' && typeof startY === 'number') {
              const deltaX = e.changedTouches[0].clientX - startX;
              const deltaY = e.changedTouches[0].clientY - startY;
              if (deltaX < -40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                setIsMobileMenuOpen(false);
              }
            }
          }}
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[240px] h-full z-10 animate-in slide-in-from-left duration-200">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              onSeedData={handleSeedData}
              onResetDemo={handleResetDemo}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* PERSISTENT TOP HEADER */}
        <Header
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onExportReport={handleExportCSV}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          timeRange={selectedTimeRange}
          onTimeRangeChange={setSelectedTimeRange}
        />

        {isDemoMode() && (
          <div className="mx-4 mt-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200 flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>
              <strong>Demo data / sandbox</strong> — read-only dashboard with in-memory sandbox; citizen submissions are classified by Gemini (or rule-based fallback) and never written to Firestore or Storage.
            </span>
          </div>
        )}

        {/* MAIN BODY CONTAINER WITH KEY TO TRIGGER PAGE TRANSITION */}
        <main
          key={activeTab}
          className="page-transition-enter flex-1 p-4 sm:p-6 lg:p-6 w-full max-w-[1600px] mx-auto"
        >
          <Suspense fallback={<RouteFallback />}>
            <DashboardPage
              activeTab={activeTab as any}
              onSelectTab={handleSelectTab}
              selectedTimeRange={selectedTimeRange}
            />
          </Suspense>
        </main>

        {/* RESTRAINED FOOTER */}
        <footer className="border-t border-[var(--border-dim)] bg-[var(--bg-subtle)] py-3 px-6 text-center text-[12px] text-[var(--text-tertiary)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <BrandMark size={14} className="shrink-0" />
              <span className="font-semibold text-[var(--text-secondary)]">NagarVaani</span>
              <span>•</span>
              <span>Multilingual AI Infrastructure Intelligence for BRICS Nations</span>
              <span>•</span>
              <a
                href="/data/SOURCES.md"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--brand-secondary)] hover:underline"
              >
                Data sources (data/SOURCES.md)
              </a>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
              Census 2011 · NITI Aayog · Gemini 2.5 Flash
            </div>
          </div>
        </footer>

        {/* SEED CONFIRMATION TOAST */}
        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[13px] text-[var(--text-primary)] font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );

  // In demo mode the dashboard is always visible — no login gate
  if (DEMO) {
    return <>{dashboardShell}</>;
  }

  return (
    <AdminGate>
      {dashboardShell}
    </AdminGate>
  );
}
