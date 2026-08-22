'use client';

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/themeContext";

interface ThemeToggleProps {
  variant?: "icon" | "pill" | "switch";
  className?: string;
  id?: string;
}

export default function ThemeToggle({
  variant = "icon",
  className = "",
  id = "theme-toggle-btn",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        id={id}
        onClick={toggleTheme}
        className={`h-8 px-3 rounded-[8px] border transition-all duration-200 flex items-center gap-2 text-[12px] font-semibold cursor-pointer select-none ${
          isDark
            ? "bg-[var(--bg-elevated)] border-[var(--border-base)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            : "bg-white border-[#e2e8f0] text-[#1e293b] hover:bg-[#f1f5f9] shadow-2xs"
        } ${className}`}
        title={`Current: ${isDark ? "Dark" : "Light"} mode. Click to switch.`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Light mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Dark mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === "switch") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            {isDark ? "Dark Theme Active" : "Light Theme Active"}
          </span>
        </div>

        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
            isDark
              ? "bg-[var(--brand-primary)] justify-end"
              : "bg-[#cbd5e1] justify-start"
          }`}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          <span className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200" />
        </button>
      </div>
    );
  }

  // Default "icon" variant
  return (
    <button
      type="button"
      id={id}
      onClick={toggleTheme}
      className={`h-7 w-7 min-w-[28px] min-h-[28px] sm:h-8 sm:w-8 sm:min-w-[32px] sm:min-h-[32px] rounded-[var(--radius-sm)] border transition-all duration-200 flex items-center justify-center cursor-pointer select-none ${
        isDark
          ? "bg-[var(--bg-elevated)] border-[var(--border-dim)] hover:border-[var(--border-base)] text-amber-400 hover:text-amber-300"
          : "bg-white border-[#e2e8f0] hover:bg-[#f8fafc] text-indigo-600 hover:text-indigo-700 shadow-2xs"
      } ${className}`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
}
