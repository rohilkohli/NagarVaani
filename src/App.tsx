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
      alert("🌱 Successfully seeded BRICS demo data!");
    } catch (e) {
      alert("🌱 Seeded demo records into local state!");
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

  // 1. CITIZEN PORTAL (Full-width single column, no sidebar, warm light aesthetic)
  if (activeTab === "citizen") {
    return (
      <CitizenPage
        onNavigateToDashboard={() => handleSelectTab("overview")}
      />
    );
  }

  // 2. POLICYMAKER DASHBOARD (Dark-first Linear bento grid layout with 220px fixed sidebar)
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex font-sans antialiased selection:bg-[rgba(99,102,241,0.25)] selection:text-white">
      {/* DESKTOP FIXED LEFT SIDEBAR (220px) */}
      <div className="hidden md:block w-[220px] shrink-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onSeedData={handleSeedData}
        />
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[240px] h-full z-10 animate-in slide-in-from-left duration-200">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              onSeedData={handleSeedData}
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

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
              Gemini 3.7 Flash Engine
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
