'use client';

import React, { useState, useEffect } from "react";
import { MapPin, Users, Sparkles, Loader2 } from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

interface NearYouPanelProps {
  district: string;
  country?: string;
  currentSubmissionId?: string | null;
}

const CATEGORY_EMOJIS: Record<ComplaintCategory | string, string> = {
  roads: "🛣️",
  water: "💧",
  electricity: "⚡",
  sanitation: "🚽",
  health: "🏥",
  education: "🏫",
  other: "📋",
};

function formatDaysAgo(dateInput: any): string {
  if (!dateInput) return "Recently";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays <= 0) {
    if (diffHours <= 0) return "Just now";
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

export default function NearYouPanel({
  district,
  country = "India",
  currentSubmissionId,
}: NearYouPanelProps) {
  const [reports, setReports] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalDistrictCount, setTotalDistrictCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchNearReports() {
      if (!district) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const cleanDist = district.trim().toLowerCase();

      try {
        // Query Firestore for matching district
        const q = query(
          collection(db, "submissions"),
          where("district", "==", district.trim()),
          limit(10)
        );
        const snapshot = await getDocs(q);

        let list: Submission[] = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id.startsWith("NV-") ? doc.id : `NV-${doc.id.slice(0, 6).toUpperCase()}`,
              firestoreId: doc.id,
              text: d.text || "",
              language: d.language || "English",
              category: (d.category as ComplaintCategory) || "roads",
              urgency: (d.urgency as 1 | 2 | 3 | 4 | 5) || 3,
              summary_english: d.summary_english || d.text || "",
              district: d.district || district,
              state: d.state || "",
              country: d.country || country,
              lat: d.lat || 0,
              lng: d.lng || 0,
              created_at: d.created_at ? new Date(d.created_at) : new Date(),
              status: d.status || "classified",
              upvotes: Number(d.upvotes) || 0,
            };
          });
        }

        // If firestore returned few/no results, merge or fallback to seed submissions
        if (list.length === 0) {
          const seedMatches = ALL_SEED_SUBMISSIONS.filter(
            (s) => s.district.toLowerCase() === cleanDist
          );
          list = seedMatches;
        }

        // Filter out the current user's newly submitted report from the list
        const others = list.filter(
          (item) => item.id !== currentSubmissionId && (!item.firestoreId || item.firestoreId !== currentSubmissionId)
        );

        // Sort descending by created_at
        others.sort((a, b) => {
          const tA = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at).getTime();
          const tB = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at).getTime();
          return tB - tA;
        });

        if (isMounted) {
          setTotalDistrictCount(list.length + (currentSubmissionId ? 1 : 0));
          setReports(others.slice(0, 5));
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Notice querying near reports, using seed fallback:", err);
        const seedMatches = ALL_SEED_SUBMISSIONS.filter(
          (s) => s.district.toLowerCase() === cleanDist
        ).filter((item) => item.id !== currentSubmissionId);

        if (isMounted) {
          setTotalDistrictCount(seedMatches.length + 1);
          setReports(seedMatches.slice(0, 5));
          setIsLoading(false);
        }
      }
    }

    fetchNearReports();

    return () => {
      isMounted = false;
    };
  }, [district, country, currentSubmissionId]);

  return (
    <div
      className="text-left bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[14px] p-4.5 sm:p-5 space-y-3.5 shadow-xs"
      id="near-you-reports-panel"
    >
      {/* SECTION HEADER & SOCIAL PROOF */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">📍</span>
          <h3 className="text-[14px] font-bold text-[var(--text-primary)] tracking-tight">
            Reports near {district || "your area"}
          </h3>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
          Live Community
        </span>
      </div>

      {/* SOCIAL PROOF BANNER */}
      {reports.length >= 3 && (
        <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[12px] font-medium">
          <Users className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Your report joins <strong className="font-bold">{totalDistrictCount}</strong> others from {district}.
          </span>
        </div>
      )}

      {/* CONTENT LIST / STATES */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-[var(--text-secondary)] text-[12px]">
          <Loader2 className="w-4 h-4 animate-spin text-[#6366f1]" />
          <span>Checking nearby citizen reports...</span>
        </div>
      ) : reports.length === 0 ? (
        /* ZERO RESULTS STATE */
        <div className="py-4 px-3 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-dim)] text-center space-y-1">
          <div className="text-[18px]">🌱</div>
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">
            You're the first to report from {district || "this area"}!
          </p>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Your report will appear here for others in your community.
          </p>
        </div>
      ) : (
        /* COMPACT CARDS LIST (Limit 5) */
        <div className="space-y-2">
          {reports.map((item, idx) => {
            const emoji = CATEGORY_EMOJIS[item.category] || "📋";
            const summary = (item.summary_english || item.text || "Civic infrastructure issue reported").trim();
            const truncated = summary.length > 60 ? `${summary.slice(0, 60)}…` : summary;
            const timeAgo = formatDaysAgo(item.created_at);

            return (
              <div
                key={item.id || item.firestoreId || idx}
                className="flex items-center justify-between gap-3 p-2.5 rounded-[10px] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] border border-[var(--border-dim)] transition-colors"
              >
                {/* Left: Category Emoji */}
                <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-dim)] flex items-center justify-center text-[15px] shrink-0 shadow-2xs">
                  {emoji}
                </div>

                {/* Center: Summary English (truncated to 60 chars) */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--text-primary)] font-medium leading-[1.35] line-clamp-1">
                    {truncated}
                  </p>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">
                    {item.category}
                  </span>
                </div>

                {/* Right: X days ago in grey */}
                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
