'use client';

import React, { useState, useEffect, useRef } from "react";
import { NavTab } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/languageContext";
import {
  Download,
  Menu,
  X,
  ChevronDown,
  FilePlus2,
  Clock,
  Check,
  Globe,
} from "lucide-react";

export type TimeRange = "today" | "7d" | "30d" | "90d" | "all";

export const TIME_RANGE_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onExportReport?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
}

export default function Header({
  activeTab,
  onSelectTab,
  onExportReport,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  timeRange = "30d",
  onTimeRangeChange,
}: HeaderProps) {
  const { language, setLanguage, currentLangOption, t } = useLanguage();
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [secondsAgo, setSecondsAgo] = useState<number>(3);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const tabTitles: Record<string, string> = {
    overview: t("overview", "Executive Overview"),
    heatmap: t("demandHeatmap", "Demand Heatmap"),
    brics: t("bricsComparison", "BRICS Comparative View"),
    reports: t("allSubmissions", "All Reports"),
    settings: t("settings", "System Settings"),
    priority: t("priorityInterventions", "AI Priorities"),
    departments: t("departments", "Department SLAs & Routing"),
    citizen: t("citizenPortal", "Submit Grievance"),
  };

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
        if (deltaX > 0 && !isMobileMenuOpen && (touchStartXRef.current < 40 || touchStartYRef.current < 60)) {
          onToggleMobileMenu();
        } else if (deltaX < 0 && isMobileMenuOpen) {
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

  const sectionTitle = tabTitles[activeTab] || t("overview", "Executive Overview");

  return (
    <header
      onTouchStart={handleHeaderTouchStart}
      onTouchEnd={handleHeaderTouchEnd}
      className="h-[54px] min-h-[54px] w-full px-4 sm:px-6 flex items-center justify-between border-b border-[var(--border-dim)] bg-[var(--bg-base)] sticky top-0 z-30 select-none touch-pan-y"
      id="main-header"
    >
      {/* LEFT: Mobile hamburger + Section Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" strokeWidth={2} /> : <Menu className="w-4 h-4" strokeWidth={2} />}
          </button>
        )}

        <h3 className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)] leading-none">
          {sectionTitle}
        </h3>
      </div>

      {/* RIGHT: Language Selector + Time range + Export + Theme + Citizen link */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Instant Global Language Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen((prev) => !prev)}
            className="h-8 px-2 sm:px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Switch UI Language"
          >
            <span className="text-[14px] leading-none">{currentLangOption.flag}</span>
            <span className="hidden md:inline font-semibold">{currentLangOption.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" strokeWidth={2} />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] shadow-xl py-1 z-50 animate-in fade-in duration-100 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-dim)]">
                {t("selectLanguage", "Select Language")}
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[12px] hover:bg-[var(--bg-surface)] cursor-pointer flex items-center justify-between transition-colors ${
                    language === lang.code
                      ? "text-[#6366f1] font-bold bg-[var(--brand-subtle)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[15px]">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">({lang.name})</span>
                  </div>
                  {language === lang.code && <Check className="w-3.5 h-3.5 text-[#6366f1]" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time range selector (ghost button: "Last 30 days ▾") */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setIsRangeDropdownOpen((prev) => !prev)}
            className="h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span>{TIME_RANGE_OPTIONS.find((opt) => opt.id === timeRange)?.label || "Last 30 days"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" strokeWidth={2} />
          </button>

          {isRangeDropdownOpen && (
            <div className="absolute right-0 mt-1 w-36 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-base)] shadow-lg py-1 z-50 animate-in fade-in duration-100">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onTimeRangeChange?.(opt.id);
                    setIsRangeDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-[12px] hover:bg-[var(--bg-surface)] cursor-pointer flex items-center justify-between transition-colors ${
                    timeRange === opt.id
                      ? "text-[var(--brand-secondary)] font-semibold bg-[var(--brand-subtle)]/50"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span>{opt.label}</span>
                  {timeRange === opt.id && <Check className="w-3.5 h-3.5 text-[var(--brand-secondary)]" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Last updated */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-normal">
          <Clock className="w-3 h-3 text-[var(--text-tertiary)]" strokeWidth={1.75} />
          <span>{secondsAgo}s</span>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={onExportReport}
          id="btn-export-report"
          className="h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.75} />
          <span className="hidden sm:inline">{t("exportCSV", "Export")}</span>
        </button>

        {/* Theme Switcher Toggle */}
        <ThemeToggle id="header-theme-toggle" />

        {/* Citizen Portal Link */}
        <button
          type="button"
          onClick={() => onSelectTab("citizen")}
          className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--brand-subtle)] hover:bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/25 text-[12px] text-[var(--brand-secondary)] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <FilePlus2 className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">{t("citizenPortal", "Citizen Portal")}</span>
        </button>
      </div>
    </header>
  );
}
