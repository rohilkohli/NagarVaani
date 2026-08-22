'use client';

import React, { useState, useEffect, useRef } from "react";
import { NavTab } from "./Sidebar";
import {
  Download,
  Menu,
  X,
  ChevronDown,
  FilePlus2,
} from "lucide-react";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onExportReport?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

const TAB_TITLES: Record<string, string> = {
  overview: "Executive Overview",
  heatmap: "Demand Heatmap",
  brics: "BRICS Comparative View",
  reports: "All Reports",
  settings: "System Settings",
  priority: "AI Priorities",
  citizen: "Submit Grievance",
};

const TIMEZONES = ["IST", "UTC", "BRT", "MSK", "SAST", "CST"];

export default function Header({
  activeTab,
  onSelectTab,
  onExportReport,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}: HeaderProps) {
  const [selectedTz, setSelectedTz] = useState<string>("IST");
  const [isTzDropdownOpen, setIsTzDropdownOpen] = useState<boolean>(false);
  const [secondsAgo, setSecondsAgo] = useState<number>(3);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 30 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global edge-swipe detection on mobile viewport
  useEffect(() => {
    if (!onToggleMobileMenu) return;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartXRef.current = e.touches[0].clientX;
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartXRef.current;
      const deltaY = endY - touchStartYRef.current;

      const isHorizontalSwipe = Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

      if (isHorizontalSwipe) {
        // Swipe right to open drawer (especially from left edge or header)
        if (deltaX > 0 && !isMobileMenuOpen && (touchStartXRef.current < 40 || touchStartYRef.current < 60)) {
          onToggleMobileMenu();
        }
        // Swipe left to close drawer
        else if (deltaX < 0 && isMobileMenuOpen) {
          onToggleMobileMenu();
        }
      }

      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };

    window.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    window.addEventListener("touchend", handleGlobalTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleGlobalTouchStart);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isMobileMenuOpen, onToggleMobileMenu]);

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || !onToggleMobileMenu) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && !isMobileMenuOpen) {
        onToggleMobileMenu();
      } else if (deltaX < 0 && isMobileMenuOpen) {
        onToggleMobileMenu();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const sectionTitle = TAB_TITLES[activeTab] || "Executive Overview";

  return (
    <header
      onTouchStart={handleHeaderTouchStart}
      onTouchEnd={handleHeaderTouchEnd}
      className="h-[52px] min-h-[52px] w-full px-4 sm:px-6 flex items-center justify-between border-b border-[var(--border-dim)] bg-[var(--bg-base)] sticky top-0 z-30 select-none touch-pan-y"
      id="main-header"
    >
      {/* LEFT: Mobile hamburger (36px × 36px, strictly visible on <768px, md:hidden) + Section Title (H3) */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <h3 className="text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">
          {sectionTitle}
        </h3>
      </div>

      {/* RIGHT: Timezone selector + Last updated + Export button + Quick Citizen link */}
      <div className="flex items-center gap-3">
        {/* Timezone selector (ghost button: "IST ▾") */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTzDropdownOpen((prev) => !prev)}
            className="h-7 px-2 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-transparent hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{selectedTz}</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
          </button>

          {isTzDropdownOpen && (
            <div className="absolute right-0 mt-1 w-24 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] shadow-lg py-1 z-50 animate-in fade-in duration-100">
              {TIMEZONES.map((tz) => (
                <button
                  key={tz}
                  onClick={() => {
                    setSelectedTz(tz);
                    setIsTzDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-1 text-left text-[12px] font-mono hover:bg-[var(--bg-surface)] cursor-pointer ${
                    selectedTz === tz
                      ? "text-[var(--brand-secondary)] font-bold"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {tz}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Last updated: "Updated 3s ago" in grey small */}
        <span className="hidden sm:inline text-[12px] text-[var(--text-tertiary)] font-normal">
          Updated {secondsAgo}s ago
        </span>

        {/* Export button (ghost with download icon) */}
        <button
          type="button"
          onClick={onExportReport}
          id="btn-export-report"
          className="h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-transparent hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Citizen Portal Ghost Link */}
        <button
          type="button"
          onClick={() => onSelectTab("citizen")}
          className="h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--brand-subtle)] hover:bg-[var(--brand-primary)]/20 text-[12px] text-[var(--brand-secondary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors ml-1"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Citizen Portal</span>
        </button>
      </div>
    </header>
  );
}
