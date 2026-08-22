'use client';

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  Clock,
  Share2,
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Check,
  Building2,
  FileText,
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface TrackComplaintProps {
  trackingId?: string;
  onNavigateToCitizen?: () => void;
  onNavigateToDashboard?: () => void;
  onSelectTrackId?: (id: string) => void;
}

const CATEGORY_COLORS: Record<ComplaintCategory, { bg: string; text: string; border: string; label: string }> = {
  roads: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30", label: "Roads & Transit" },
  water: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/30", label: "Water Supply" },
  electricity: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", label: "Power & Grid" },
  sanitation: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", label: "Sanitation & Drainage" },
  health: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/30", label: "Public Health" },
  education: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30", label: "Education" },
  other: { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/30", label: "Civic Infra" },
};

function formatRelativeTime(dateInput: Date | string | number): string {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "Recently submitted";

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 172800) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recently submitted";
  }
}

export default function TrackComplaint({
  trackingId = "NV-849201",
  onNavigateToCitizen,
  onNavigateToDashboard,
  onSelectTrackId,
}: TrackComplaintProps) {
  const currentTrackingId = trackingId || "NV-849201";
  const [searchInput, setSearchInput] = useState<string>(currentTrackingId);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync search input when prop changes
  useEffect(() => {
    if (trackingId) {
      setSearchInput(trackingId);
    }
  }, [trackingId]);

  // Load complaint data from Firestore / API / SeedData
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function fetchComplaint() {
      const cleanId = (trackingId || "NV-849201").trim();

      // 1. Try local seed submissions first for instant match
      const seedMatch = ALL_SEED_SUBMISSIONS.find(
        (s) =>
          (s.id && s.id.toLowerCase() === cleanId.toLowerCase()) ||
          cleanId.toLowerCase().includes((s.id || "").toLowerCase()) ||
          (s.id && (s.id.toLowerCase().includes(cleanId.toLowerCase()) || cleanId.slice(-4).toLowerCase() === s.id.slice(-4).toLowerCase()))
      );

      if (seedMatch && isMounted) {
        setSubmission(seedMatch);
        setIsLoading(false);
        return;
      }

      // 2. Try Firestore query
      try {
        const rawSuffix = cleanId.replace(/^NV-/i, "");
        const submissionsCol = collection(db, "submissions");
        const snapshot = await getDocs(submissionsCol);
        
        let foundDoc: Submission | null = null;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            docSnap.id === rawSuffix ||
            docSnap.id.startsWith(rawSuffix) ||
            docSnap.id.toUpperCase() === rawSuffix.toUpperCase() ||
            data.id === cleanId
          ) {
            foundDoc = {
              id: `NV-${docSnap.id.slice(0, 6).toUpperCase()}`,
              text: data.text || "",
              language: data.language || "English",
              category: (data.category as ComplaintCategory) || "roads",
              urgency: (data.urgency as any) || 3,
              summary_english: data.summary_english || data.text || "",
              district: data.district || "District",
              state: data.state || "",
              country: data.country || "India",
              lat: data.lat || 20.5937,
              lng: data.lng || 78.9629,
              photo_url: data.photo_url || undefined,
              created_at: data.created_at ? new Date(data.created_at) : new Date(),
              status: (data.status as any) || "classified",
            };
          }
        });

        if (foundDoc && isMounted) {
          setSubmission(foundDoc);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Firestore lookup note:", err);
      }

      // 3. Try server endpoint
      try {
        const res = await fetch(`/api/track/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const resData = await res.json();
          if (resData.submission && isMounted) {
            setSubmission({
              ...resData.submission,
              created_at: new Date(resData.submission.created_at || Date.now()),
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("API track lookup fallback:", apiErr);
      }

      // 4. Fallback prototype record if not found
      if (isMounted) {
        setSubmission({
          id: cleanId.startsWith("NV-") ? cleanId : `NV-${cleanId.toUpperCase()}`,
          text: "Critical road surface crater on main avenue causing dangerous vehicle swerves and severe traffic congestion.",
          language: "English",
          category: "roads",
          urgency: 4,
          summary_english: "Severe pothole damage and asphalt degradation on main transit road causing accident risks.",
          district: "Patna",
          state: "Bihar",
          country: "India",
          lat: 25.5941,
          lng: 85.1376,
          created_at: new Date(Date.now() - 3.5 * 3600 * 1000),
          status: "classified",
        });
        setIsLoading(false);
      }
    }

    fetchComplaint();
    return () => {
      isMounted = false;
    };
  }, [trackingId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const formatted = searchInput.trim().toUpperCase().startsWith("NV-")
      ? searchInput.trim().toUpperCase()
      : `NV-${searchInput.trim().toUpperCase()}`;
    if (onSelectTrackId) {
      onSelectTrackId(formatted);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/?track=${encodeURIComponent(submission?.id || currentTrackingId)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const categoryStyle = submission ? CATEGORY_COLORS[submission.category] || CATEGORY_COLORS.roads : CATEGORY_COLORS.roads;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] font-sans antialiased py-8 px-4 sm:px-6">
      <div className="max-w-[680px] mx-auto space-y-6">
        
        {/* TOP NAVIGATION BAR */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateToCitizen}
            className="h-9 px-3 rounded-[10px] border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5f4] text-[#44403c] text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievance Portal</span>
          </button>

          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="h-9 px-3 rounded-[10px] bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/15 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Policymaker Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* SEARCH BAR (For tracking any reference ID) */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-[#78716c] pointer-events-none" />
          <input
            type="text"
            placeholder="Enter tracking ID (e.g. NV-849201 or seed-in-101)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 pl-10 pr-24 rounded-[12px] border border-[#e5e4e0] bg-[#ffffff] text-[14px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#6366f1] shadow-2xs transition-all font-mono"
          />
          <button
            type="submit"
            className="absolute right-1.5 h-8 px-3 rounded-[8px] bg-[#6366f1] text-white text-[12px] font-semibold cursor-pointer hover:bg-[#4f46e5] transition-colors"
          >
            Track
          </button>
        </form>

        {/* ========================================================================= */}
        {/* MAIN STATUS CARD */}
        {/* ========================================================================= */}
        <div className="bg-[#ffffff] rounded-[20px] border border-[#e5e4e0] p-6 sm:p-8 space-y-8 shadow-sm">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f5f5f4] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-[6px] bg-[#f5f5ff] text-[#6366f1] border border-[#e0e7ff] text-[11px] font-mono font-bold">
                  LIVE TRACKING
                </span>
                <span className="text-[12px] text-[#78716c]">National Grievance Network</span>
              </div>
              <h2 className="text-[24px] font-bold text-[#1c1917] tracking-tight">
                Track Your Report
              </h2>
            </div>

            <div className="bg-[#f5f5ff] border border-[#e0e7ff] rounded-[12px] px-4 py-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#6366f1] block">
                REFERENCE CODE
              </span>
              <span className="font-mono text-[18px] font-bold text-[#6366f1] select-all">
                {submission?.id || currentTrackingId}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STATUS TIMELINE (Vertical Stepper, 4 Steps) */}
          {/* ========================================================================= */}
          <div className="space-y-1 relative pl-2">
            
            {/* STEP 1: SUBMITTED */}
            <div className="relative flex items-start gap-4 pb-8">
              {/* Connector line down to step 2 */}
              <div className="absolute top-6 left-3 -ml-[1px] w-[2px] h-[calc(100%-12px)] bg-[#22c55e]" />

              {/* Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Content */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[#1c1917]">
                    Report Submitted
                  </h4>
                  <span className="text-[12px] font-medium text-[#22c55e]">Completed</span>
                </div>
                <p className="text-[13px] text-[#78716c]">
                  Your report was received by the municipal infrastructure system
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#a8a29e] font-mono pt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{submission?.created_at ? formatRelativeTime(submission.created_at) : "Today"}</span>
                </div>
              </div>
            </div>

            {/* STEP 2: AI CLASSIFICATION */}
            <div className="relative flex items-start gap-4 pb-8">
              {/* Connector line down to step 3 */}
              <div className="absolute top-6 left-3 -ml-[1px] w-[2px] h-[calc(100%-12px)] bg-[#6366f1]" />

              {/* Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Content */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-[#1c1917]">
                      AI Classification
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#f5f5ff] text-[#6366f1] text-[10px] font-mono font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Gemini 3.7 Flash
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-[#22c55e]">Completed</span>
                </div>

                <p className="text-[13px] text-[#78716c]">
                  Gemini AI classified and translated your complaint
                </p>

                {/* AI Classification Summary Box */}
                {submission && (
                  <div className="p-3 rounded-[10px] bg-[#fafaf9] border border-[#e5e4e0] space-y-2 text-[12px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                        {categoryStyle.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#fee2e2] text-[#ef4444] border border-[#fecaca] text-[11px] font-semibold">
                        Urgency {submission.urgency}/5
                      </span>
                      <span className="text-[#a8a29e] text-[11px]">
                        Language: {submission.language || "Detected"}
                      </span>
                    </div>

                    <div className="text-[#44403c] italic leading-relaxed">
                      <span className="font-semibold text-[#1c1917] not-italic">AI Summary: </span>
                      "{submission.summary_english || submission.text}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: POLICYMAKER REVIEW (In Progress) */}
            <div className="relative flex items-start gap-4 pb-8">
              {/* Connector line down to step 4 */}
              <div className="absolute top-6 left-3 -ml-[1px] w-[2px] h-[calc(100%-12px)] bg-[#e5e4e0]" />

              {/* Active Spinner Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>

              {/* Content */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[#6366f1]">
                    Policymaker Review
                  </h4>
                  <span className="text-[12px] font-semibold text-[#6366f1] bg-[#f5f5ff] px-2 py-0.5 rounded-[4px]">
                    In Progress
                  </span>
                </div>
                <p className="text-[13px] text-[#44403c] font-medium">
                  Your report has been added to the priority queue
                </p>
                <div className="flex items-center gap-1.5 text-[12px] text-[#78716c] pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#6366f1]" />
                  <span>Estimated review: within 7 working days</span>
                </div>
              </div>
            </div>

            {/* STEP 4: ACTION ASSIGNED (Pending) */}
            <div className="relative flex items-start gap-4">
              {/* Grey Circle Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[#e5e4e0] text-[#78716c] flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[#78716c]">
                    Action Assigned
                  </h4>
                  <span className="text-[12px] text-[#a8a29e]">Pending</span>
                </div>
                <p className="text-[13px] text-[#a8a29e]">
                  Government department notified
                </p>
                <p className="text-[12px] text-[#a8a29e] italic">
                  You will be updated when action is taken
                </p>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* COMPLAINT DETAILS CARD */}
          {/* ========================================================================= */}
          {submission && (
            <div className="bg-[#fafaf9] rounded-[16px] border border-[#e5e4e0] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e4e0] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#78716c]" />
                  <h3 className="text-[14px] font-bold text-[#1c1917] uppercase tracking-[0.04em]">
                    Original Complaint Details
                  </h3>
                </div>
                
                {/* Urgency 5-dots display */}
                <div className="flex items-center gap-1.5" title={`Urgency ${submission.urgency} of 5`}>
                  <span className="text-[11px] font-semibold text-[#78716c] mr-1">Urgency:</span>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= submission.urgency
                          ? submission.urgency >= 4
                            ? "bg-[#ef4444]"
                            : submission.urgency === 3
                            ? "bg-[#f59e0b]"
                            : "bg-[#22c55e]"
                          : "bg-[#e5e4e0]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Location & Metadata Row */}
              <div className="flex items-center gap-4 text-[12px] text-[#44403c] flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#6366f1]" />
                  <span className="font-semibold">{submission.district}</span>
                  {submission.state && <span>, {submission.state}</span>}
                  <span>({submission.country})</span>
                </div>
                <div className="flex items-center gap-1 text-[#78716c]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted {formatRelativeTime(submission.created_at)}</span>
                </div>
              </div>

              {/* Original Text in bordered quote box */}
              <div className="relative pl-3 border-l-2 border-[#6366f1] bg-[#ffffff] p-3 rounded-r-[8px] text-[13px] text-[#1c1917] leading-relaxed shadow-2xs">
                "{submission.text}"
              </div>

              {/* Attached Photo Thumbnail (if present) */}
              {submission.photo_url && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#78716c] uppercase">Attached Evidence Photo</span>
                  <div className="w-36 h-24 rounded-[8px] overflow-hidden border border-[#e5e4e0] shadow-2xs">
                    <img
                      src={submission.photo_url}
                      alt="Complaint Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SHARE & ACTIONS BUTTONS */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-full sm:w-auto h-11 px-5 rounded-[12px] border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5f4] text-[#1c1917] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-[#22c55e]">Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#6366f1]" />
                  <span>Share this report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNavigateToCitizen}
              className="w-full sm:w-auto h-11 px-6 rounded-[12px] text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:opacity-95"
              style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
              }}
            >
              <span>Submit Another Grievance</span>
            </button>
          </div>

        </div>

        {/* RESTRAINED FOOTER NOTE */}
        <p className="text-center text-[12px] text-[#78716c] pt-2">
          NagarVaani Grievance Redressal Network • Powered by Gemini 3.7 Flash
        </p>

      </div>
    </div>
  );
}
