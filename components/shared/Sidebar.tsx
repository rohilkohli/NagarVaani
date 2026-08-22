'use client';

import React from "react";
import {
  LayoutDashboard,
  Map,
  Globe2,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";

export type NavTab = "overview" | "heatmap" | "brics" | "reports" | "settings" | "citizen" | "priority";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onSeedData?: () => void;
  onResetDemo?: () => void;
  className?: string;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  onSeedData,
  onResetDemo,
  className = "",
}: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "heatmap", label: "Heatmap", icon: Map },
    { id: "priority", label: "AI Priorities", icon: Sparkles },
    { id: "brics", label: "BRICS View", icon: Globe2 },
    { id: "reports", label: "All Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`w-[220px] min-w-[220px] h-screen fixed top-0 left-0 flex flex-col justify-between z-40 bg-[var(--bg-subtle)] border-r border-[var(--border-dim)] select-none ${className}`}
      id="main-sidebar"
    >
      {/* TOP: Brand & Navigation */}
      <div className="flex flex-col">
        {/* Logo area (top, 52px height, aligned with header) */}
        <div className="h-[52px] px-4 flex items-center gap-2.5 border-b border-[var(--border-dim)]">
          <div className="w-6 h-6 min-w-[24px] rounded-[5px] bg-[var(--brand-primary)] flex items-center justify-center text-white shadow-xs">
            <span className="text-[12px] font-bold leading-none">N</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            NagarVaani
          </span>
        </div>

        {/* Navigation Section (MICRO label "NAVIGATION") */}
        <div className="px-3 pt-5 pb-2">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-[0.06em] uppercase text-[var(--text-tertiary)]">
            NAVIGATION
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  id={`nav-${item.id}`}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[14px] font-medium transition-all duration-150 text-left cursor-pointer ${
                    isActive
                      ? "bg-[var(--brand-subtle)] text-[var(--text-primary)] border-l-2 border-[var(--brand-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-l-2 border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[var(--brand-secondary)]" : "text-[var(--text-secondary)]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* BOTTOM OF SIDEBAR (PINNED) */}
      <div className="p-3 border-t border-[var(--border-dim)] bg-[var(--bg-subtle)] space-y-2">
        {/* Row 1: green pulse dot + "LIVE" in green micro + "auto-updating" in var(--text-tertiary) small */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-dim)]">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] live-pulse shrink-0"></span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold tracking-[0.06em] text-[var(--green)] uppercase">
              LIVE
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)] truncate">
              auto-updating
            </span>
          </div>
        </div>

        {/* Row 2: "🌱 Seed Demo Data" ghost button (full width) */}
        {onSeedData && (
          <button
            type="button"
            onClick={onSeedData}
            id="btn-seed-demo-data"
            className="w-full h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-transparent hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🌱</span>
            <span>Seed Demo Data</span>
          </button>
        )}

        {/* Row 3: "🔄 Refresh Demo Data" ghost button (full width) */}
        {onResetDemo && (
          <button
            type="button"
            onClick={onResetDemo}
            id="btn-refresh-demo-data"
            className="w-full h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border-dim)] bg-transparent hover:bg-[var(--bg-elevated)] hover:border-[var(--border-base)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🔄</span>
            <span>Refresh Demo Data</span>
          </button>
        )}
      </div>
    </aside>
  );
}
