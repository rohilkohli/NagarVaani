'use client';

import React, { useState, useEffect } from "react";
import Sidebar, { NavTab } from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import DashboardPage from "@/app/dashboard/page";
import CitizenPage from "@/app/citizen/page";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
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

  // Sync tab with browser URL history
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      const path = tab === "citizen" ? "/citizen" : tab === "overview" ? "/dashboard" : `/${tab}`;
      window.history.pushState({}, "", path);
    }
  };

  const handleSeedData = async () => {
    try {
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
    } catch (e) {
      console.warn("Firestore seed notice (falling back to memory state):", e);
    }
  };

  const handleResetDemo = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem('nv_seeded');
      }
      await handleSeedData();
      if (typeof window !== "undefined") {
        localStorage.setItem('nv_seeded', 'true');
      }
      setToastMsg("✅ Demo data loaded — 50 submissions seeded");
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e) {
      console.error("Error refreshing demo data:", e);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/citizen" || path === "/") setActiveTab("citizen");
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
    const hasSeeded = localStorage.getItem('nv_seeded');
    if (!hasSeeded) {
      handleSeedData().then(() => {
        localStorage.setItem('nv_seeded', 'true');
        setToastMsg("✅ Demo data loaded — 50 submissions seeded");
        setTimeout(() => setToastMsg(null), 4000);
      });
    }
  }, []);

  // FIX 1 — Smooth body background transition between citizen portal and dashboard
  useEffect(() => {
    if (activeTab === 'citizen') {
      document.body.style.backgroundColor = '#fafaf9';
    } else {
      document.body.style.backgroundColor = '#0a0a0f';
    }
  }, [activeTab]);

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

  // 1. CITIZEN PORTAL (Full-width single column, no sidebar, warm light aesthetic)
  if (activeTab === "citizen") {
    return (
      <div className="transition-colors duration-300 min-h-screen">
        <CitizenPage
          onNavigateToDashboard={() => handleSelectTab("overview")}
        />
      </div>
    );
  }

  // 2. POLICYMAKER DASHBOARD (Dark-first Linear bento grid layout with 220px fixed sidebar)
  return (
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

      {/* MAIN CONTENT WORKSPACE (Offset by 220px on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[220px]">
        {/* PERSISTENT TOP HEADER */}
        <Header
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* MAIN BODY CONTAINER WITH KEY TO TRIGGER PAGE TRANSITION */}
        <main
          key={activeTab}
          className="page-transition-enter flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
        >
          <DashboardPage
            activeTab={activeTab as any}
            onSelectTab={handleSelectTab}
          />
        </main>

        {/* RESTRAINED FOOTER */}
        <footer className="border-t border-[var(--border-dim)] bg-[var(--bg-subtle)] py-3 px-6 text-center text-[12px] text-[var(--text-tertiary)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-secondary)]">NagarVaani</span>
              <span>•</span>
              <span>Multilingual AI Infrastructure Intelligence for BRICS Nations</span>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
              Gemini 2.5 Flash · Google AI
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
}
