'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  ThumbsUp,
  Filter,
  Search,
  MapPin,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  Users,
  ChevronDown,
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  query,
  orderBy,
} from "firebase/firestore";

interface CommunityTabProps {
  currentCountry?: string;
  onNavigateToReport?: () => void;
  onNavigateToTrack?: (trackingId: string) => void;
}

const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  all: { label: "All", emoji: "✨", bg: "bg-[#f5f5f4]", text: "text-[#1c1917]", border: "border-[#e5e4e0]" },
  roads: { label: "Roads", emoji: "🛣️", bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/25" },
  water: { label: "Water", emoji: "💧", bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-500/25" },
  electricity: { label: "Electricity", emoji: "⚡", bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/25" },
  sanitation: { label: "Sanitation", emoji: "🚽", bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-500/25" },
  health: { label: "Health", emoji: "🏥", bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-500/25" },
};

const BRICS_COUNTRIES = [
  { id: "India", name: "India", flag: "🇮🇳" },
  { id: "Brazil", name: "Brazil", flag: "🇧🇷" },
  { id: "South Africa", name: "South Africa", flag: "🇿🇦" },
  { id: "Russia", name: "Russia", flag: "🇷🇺" },
  { id: "China", name: "China", flag: "🇨🇳" },
];

function formatTimeAgo(dateInput: any): string {
  if (!dateInput) return "Recently";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
}

export default function CommunityTab({
  currentCountry = "India",
  onNavigateToReport,
  onNavigateToTrack,
}: CommunityTabProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(currentCountry);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nv_upvoted_reports");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // Sync country if parent changes
  useEffect(() => {
    if (currentCountry) {
      setSelectedCountry(currentCountry);
    }
  }, [currentCountry]);

  // Real-time Firestore Listener
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    try {
      const colRef = collection(db, "submissions");
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (!isMounted) return;

          if (!snapshot.empty) {
            const data: Submission[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id.startsWith("NV-") ? docSnap.id : `NV-${docSnap.id.slice(0, 6).toUpperCase()}`,
                firestoreId: docSnap.id,
                text: d.text || "",
                language: d.language || "English",
                category: (d.category as ComplaintCategory) || "roads",
                urgency: (d.urgency as 1 | 2 | 3 | 4 | 5) || 3,
                summary_english: d.summary_english || d.text || "",
                district: d.district || "General District",
                state: d.state || "",
                country: d.country || "India",
                lat: d.lat || 0,
                lng: d.lng || 0,
                created_at: d.created_at ? new Date(d.created_at) : new Date(),
                status: d.status || "classified",
                upvotes: Number(d.upvotes) || 0,
              };
            });
            setSubmissions(data);
          } else {
            setSubmissions(ALL_SEED_SUBMISSIONS);
          }
          setIsLoading(false);
        },
        (err) => {
          console.warn("Firestore community feed fallback to seed data:", err);
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
    } catch {
      if (isMounted) {
        setSubmissions(ALL_SEED_SUBMISSIONS);
        setIsLoading(false);
      }
    }
  }, []);

  // Upvote Handler
  const handleUpvote = async (submission: Submission, e: React.MouseEvent) => {
    e.stopPropagation();

    const targetKey = submission.firestoreId || submission.id || "";
    if (!targetKey) return;

    const alreadyUpvoted = upvotedIds.has(targetKey);
    const nextUpvoted = new Set(upvotedIds);

    if (alreadyUpvoted) {
      nextUpvoted.delete(targetKey);
    } else {
      nextUpvoted.add(targetKey);
    }

    setUpvotedIds(nextUpvoted);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nv_upvoted_reports", JSON.stringify(Array.from(nextUpvoted)));
      } catch (err) {
        console.warn("Could not persist upvote in localStorage", err);
      }
    }

    const incrementDelta = alreadyUpvoted ? -1 : 1;

    // Optimistic state update
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submission.id || (s.firestoreId && s.firestoreId === submission.firestoreId)) {
          const currentCount = s.upvotes || 0;
          return { ...s, upvotes: Math.max(0, currentCount + incrementDelta) };
        }
        return s;
      })
    );

    // Firestore update if document ID is valid
    if (submission.firestoreId) {
      try {
        const docRef = doc(db, "submissions", submission.firestoreId);
        await updateDoc(docRef, {
          upvotes: increment(incrementDelta),
        });
      } catch (err) {
        console.warn("Firestore upvote sync notice:", err);
      }
    }
  };

  // Filter & Sort submissions
  const filteredSubmissions = useMemo(() => {
    const cleanCountry = selectedCountry.toLowerCase();
    const cleanSearch = searchQuery.trim().toLowerCase();

    return submissions
      .filter((s) => {
        // Country filter
        const matchesCountry =
          !selectedCountry ||
          s.country.toLowerCase() === cleanCountry ||
          (cleanCountry === "s. africa" && s.country.toLowerCase().includes("africa"));

        // Category filter
        const matchesCat =
          selectedCategory === "all" || s.category.toLowerCase() === selectedCategory.toLowerCase();

        // Search query
        const matchesSearch =
          !cleanSearch ||
          s.district.toLowerCase().includes(cleanSearch) ||
          s.summary_english.toLowerCase().includes(cleanSearch) ||
          (s.state && s.state.toLowerCase().includes(cleanSearch));

        return matchesCountry && matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        const tA = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at).getTime();
        const tB = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at).getTime();
        return tB - tA;
      });
  }, [submissions, selectedCountry, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="community-tab-root">
      {/* HEADER SECTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6366f1] block">
            CITIZEN VOICES • COMMUNITY REPORTS
          </span>
          {/* Country Selector */}
          <div className="flex items-center gap-1 bg-white border border-[#e5e4e0] rounded-[8px] px-2 py-1 shadow-2xs">
            <span className="text-[12px]">
              {BRICS_COUNTRIES.find((c) => c.name.toLowerCase() === selectedCountry.toLowerCase())?.flag || "🌐"}
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="text-[12px] font-semibold text-[#44403c] bg-transparent border-none outline-none cursor-pointer pr-1"
            >
              {BRICS_COUNTRIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h1 className="text-[28px] font-bold tracking-[-0.02em] leading-[1.2] text-[#1c1917]">
          What Citizens Are Reporting
        </h1>
        <p className="text-[14px] text-[#78716c]">
          Real-time infrastructure grievances shaping municipal policy in {selectedCountry}. Upvote issues that affect you to raise their priority score.
        </p>
        <div className="w-[40px] h-[2px] rounded-full bg-[#6366f1] mt-2" />
      </div>

      {/* FILTER PILLS: All | Roads | Water | Electricity | Sanitation | Health */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                  isSelected
                    ? "bg-[#1c1917] text-white shadow-xs"
                    : "bg-[#ffffff] text-[#57534e] hover:bg-[#f5f5f4] border border-[#e5e4e0]"
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* SEARCH INPUT BAR */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, district, or keywords (e.g. Patna, water, blackout)..."
            className="w-full h-10 pl-9 pr-4 rounded-[12px] bg-white border border-[#e5e4e0] text-[13px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-bold text-[#78716c] hover:text-[#1c1917] absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#f5f5f4]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* FEED LIST */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-[16px] border border-[#e5e4e0]">
          <Loader2 className="w-6 h-6 animate-spin text-[#6366f1] mx-auto" />
          <p className="text-[13px] text-[#78716c]">Loading community reports...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-white rounded-[16px] border border-[#e5e4e0] p-6">
          <div className="text-[28px]">🔍</div>
          <h3 className="text-[15px] font-bold text-[#1c1917]">No reports found</h3>
          <p className="text-[13px] text-[#78716c] max-w-sm mx-auto">
            No complaints matching your selected category and search query in {selectedCountry}.
          </p>
          {onNavigateToReport && (
            <button
              type="button"
              onClick={onNavigateToReport}
              className="mt-2 h-9 px-4 rounded-[10px] bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              📝 Be the first to report an issue
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[12px] text-[#78716c] px-1">
            <span>
              Showing <strong className="text-[#1c1917]">{filteredSubmissions.length}</strong> reports in {selectedCountry}
            </span>
            <span className="text-[11px] font-mono text-[#a8a29e]">
              Sorted by most recent
            </span>
          </div>

          {filteredSubmissions.map((item, index) => {
            const cat = item.category.toLowerCase();
            const meta = CATEGORY_META[cat] || CATEGORY_META.roads;
            const targetKey = item.firestoreId || item.id || `sub-${index}`;
            const isUpvoted = upvotedIds.has(targetKey);
            const upvoteCount = item.upvotes || 0;
            const summaryClean = (item.summary_english || item.text || "Civic infrastructure grievance reported").trim();
            const timeAgo = formatTimeAgo(item.created_at);

            return (
              <div
                key={targetKey}
                className="bg-[#ffffff] border border-[#e5e4e0] hover:border-[#cbd5e1] rounded-[14px] p-4.5 space-y-3 shadow-2xs transition-all hover:shadow-xs"
              >
                {/* TOP ROW: Category Badge + District + X hours ago */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                    >
                      <span>{meta.emoji}</span>
                      <span className="capitalize">{item.category}</span>
                    </span>

                    <span className="text-[13px] font-bold text-[#1c1917] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#78716c] shrink-0" />
                      <span>{item.district}</span>
                      {item.state && (
                        <span className="text-[12px] font-normal text-[#78716c]">
                          ({item.state})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Relative Time */}
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#78716c] shrink-0">
                    <Clock className="w-3 h-3 text-[#a8a29e]" />
                    <span>{timeAgo}</span>
                  </div>
                </div>

                {/* BOTTOM: Summary Text (Anonymised — no personal details) */}
                <p className="text-[13.5px] text-[#334155] leading-[1.45] font-normal">
                  {summaryClean}
                </p>

                {/* FOOTER: Action Bar & "👍 Same issue" Button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#f5f5f4]">
                  <div className="flex items-center gap-2">
                    {/* UPVOTE BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => handleUpvote(item, e)}
                      className={`h-8 px-3 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                        isUpvoted
                          ? "bg-[#eef2ff] border border-[#6366f1] text-[#4f46e5] shadow-2xs font-bold"
                          : "bg-[#f5f5f4] hover:bg-[#e5e4e0] border border-[#e5e4e0] text-[#44403c]"
                      }`}
                      title="Confirm this issue is happening in your area to raise its priority"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-[#6366f1] text-[#6366f1]" : "text-[#78716c]"}`} />
                      <span>{isUpvoted ? "Upvoted" : "Same issue"}</span>
                      {upvoteCount > 0 && (
                        <span
                          className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            isUpvoted
                              ? "bg-[#6366f1] text-white"
                              : "bg-[#e5e4e0] text-[#44403c]"
                          }`}
                        >
                          {upvoteCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tracking link / code pill */}
                  {item.id && onNavigateToTrack && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTrack(item.id!)}
                      className="text-[11px] font-mono text-[#78716c] hover:text-[#6366f1] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.id}</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
