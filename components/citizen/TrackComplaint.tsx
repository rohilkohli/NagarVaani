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
import ThemeToggle from "@/components/shared/ThemeToggle";

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

  // Load complaint data from Firestore / API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function fetchComplaint() {
      const cleanId = (trackingId || "NV-849201").trim();

      // 1. Try real Firestore query first
      try {
        const rawSuffix = cleanId.replace(/^NV-/i, "");
        const submissionsCol = collection(db, "submissions");
        const snapshot = await getDocs(submissionsCol);
        
        let foundDoc: Submission | null = null;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            docSnap.id === rawSuffix ||
            docSnap.id === cleanId ||
            docSnap.id.startsWith(rawSuffix) ||
            docSnap.id.toUpperCase() === rawSuffix.toUpperCase() ||
            data.id === cleanId ||
            data.id?.toUpperCase() === cleanId.toUpperCase()
          ) {
            foundDoc = {
              id: data.id || `NV-${docSnap.id.slice(0, 6).toUpperCase()}`,
              firestoreId: docSnap.id,
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
              upvotes: Number(data.upvotes) || 0,
              source: data.source,
              whatsapp_from: data.whatsapp_from,
              duplicate_of: data.duplicate_of,
              duplicate_confidence: data.duplicate_confidence,
              photo_description: data.photo_description,
              photo_severity: data.photo_severity,
              photo_safety_hazard: data.photo_safety_hazard,
              ai_confidence: data.ai_confidence,
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

      // 2. Try server endpoint
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

      // 3. Check seed database as secondary fallback if Firestore has not been seeded yet
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

      // 4. If truly not found in real database
      if (isMounted) {
        setSubmission(null);
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
    <div className="min-h-screen bg-[var(--panel-bg)] text-[var(--text-primary)] font-sans antialiased py-8 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-[680px] mx-auto space-y-6">
        
        {/* TOP NAVIGATION BAR */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateToCitizen}
            className="h-9 px-3 rounded-[10px] border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievance Portal</span>
          </button>

          <div className="flex items-center gap-2">
            <ThemeToggle id="track-theme-toggle" />

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
        </div>

        {/* SEARCH BAR (For tracking any reference ID) */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Enter tracking ID (e.g. NV-849201 or seed-in-101)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 pl-10 pr-24 rounded-[12px] border border-[var(--border-dim)] bg-[var(--bg-surface)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#6366f1] shadow-2xs transition-all font-mono"
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
        <div className="bg-[var(--bg-surface)] rounded-[20px] border border-[var(--border-dim)] p-6 sm:p-8 space-y-8 shadow-sm transition-colors">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-dim)] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-[6px] bg-[var(--brand-subtle)] text-[var(--brand-secondary)] border border-[var(--brand-primary)]/30 text-[11px] font-mono font-bold">
                  LIVE TRACKING
                </span>
                <span className="text-[12px] text-[var(--text-tertiary)]">National Grievance Network</span>
              </div>
              <h2 className="text-[24px] font-bold text-[var(--text-primary)] tracking-tight">
                Track Your Report
              </h2>
            </div>

            <div className="bg-[var(--brand-subtle)] border border-[var(--brand-primary)]/30 rounded-[12px] px-4 py-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--brand-secondary)] block">
                REFERENCE CODE
              </span>
              <span className="font-mono text-[18px] font-bold text-[var(--brand-secondary)] select-all">
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
              <div className="absolute top-6 left-3 -ml-[1px] w-[2px] h-[calc(100%-12px)] bg-[var(--green)]" />

              {/* Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[var(--green)] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Content */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Report Submitted
                  </h4>
                  <span className="text-[12px] font-medium text-[var(--green)]">Completed</span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Your report was received by the municipal infrastructure system
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] font-mono pt-0.5">
                  <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span>{submission?.created_at ? formatRelativeTime(submission.created_at) : "Today"}</span>
                </div>
              </div>
            </div>

            {/* STEP 2: AI CLASSIFICATION */}
            <div className="relative flex items-start gap-4 pb-8">
              {/* Connector line down to step 3 */}
              <div className="absolute top-6 left-3 -ml-[1px] w-[2px] h-[calc(100%-12px)] bg-[var(--brand-primary)]" />

              {/* Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[var(--green)] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Content */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
                      AI Classification
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--brand-subtle)] text-[var(--brand-secondary)] border border-[var(--brand-primary)]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Gemini 3.7 Flash
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-[var(--green)]">Completed</span>
                </div>

                <p className="text-[13px] text-[var(--text-secondary)]">
                  Gemini AI classified and translated your complaint
                </p>

                {/* AI Classification Summary Box */}
                {submission && (
                  <div className="p-3.5 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-dim)] space-y-2 text-[12px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                        {categoryStyle.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#fee2e2]/20 text-[#ef4444] border border-[#fecaca]/30 text-[11px] font-semibold">
                        Urgency {submission.urgency}/5
                      </span>
                      <span className="text-[var(--text-tertiary)] text-[11px]">
                        Language: {submission.language || "Detected"}
                      </span>
                    </div>

                    <div className="text-[var(--text-secondary)] italic leading-relaxed">
                      <span className="font-semibold text-[var(--text-primary)] not-italic">AI Summary: </span>
                      "{submission.summary_english || submission.text}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: POLICYMAKER REVIEW (In Progress) */}
            <div className="relative flex items-start gap-4 pb-8">
              {/* Connector line down to step 4 */}
              <div className="absolute top-6 left-3 -ml-[1px] w-[2px] h-[calc(100%-12px)] bg-[var(--border-base)]" />

              {/* Active Spinner Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>

              {/* Content */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[var(--brand-secondary)]">
                    Policymaker Review
                  </h4>
                  <span className="text-[12px] font-semibold text-[var(--brand-secondary)] bg-[var(--brand-subtle)] border border-[var(--brand-primary)]/30 px-2 py-0.5 rounded-[4px]">
                    In Progress
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-primary)] font-medium">
                  Your report has been added to the priority queue
                </p>
                <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                  <span>Estimated review: within 7 working days</span>
                </div>
              </div>
            </div>

            {/* STEP 4: ACTION ASSIGNED (Pending) */}
            <div className="relative flex items-start gap-4">
              {/* Grey Circle Icon */}
              <div className="relative z-10 w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-tertiary)] flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[var(--text-tertiary)]">
                    Action Assigned
                  </h4>
                  <span className="text-[12px] text-[var(--text-tertiary)]">Pending</span>
                </div>
                <p className="text-[13px] text-[var(--text-tertiary)]">
                  Government department notified
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)] italic">
                  You will be updated when action is taken
                </p>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* COMPLAINT DETAILS CARD */}
          {/* ========================================================================= */}
          {submission && (
            <div className="bg-[var(--bg-elevated)] rounded-[16px] border border-[var(--border-dim)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <h3 className="text-[14px] font-bold text-[var(--text-primary)] uppercase tracking-[0.04em]">
                    Original Complaint Details
                  </h3>
                </div>
                
                {/* Urgency 5-dots display */}
                <div className="flex items-center gap-1.5" title={`Urgency ${submission.urgency} of 5`}>
                  <span className="text-[11px] font-semibold text-[var(--text-tertiary)] mr-1">Urgency:</span>
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
                          : "bg-[var(--border-base)]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Location & Metadata Row */}
              <div className="flex items-center gap-4 text-[12px] text-[var(--text-secondary)] flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                  <span className="font-semibold text-[var(--text-primary)]">{submission.district}</span>
                  {submission.state && <span>, {submission.state}</span>}
                  <span>({submission.country})</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted {formatRelativeTime(submission.created_at)}</span>
                </div>
              </div>

              {/* Original Text in bordered quote box */}
              <div className="relative pl-3 border-l-2 border-[var(--brand-primary)] bg-[var(--bg-surface)] p-3 rounded-r-[8px] text-[13px] text-[var(--text-primary)] leading-relaxed shadow-2xs">
                "{submission.text}"
              </div>

              {/* Attached Photo Thumbnail (if present) */}
              {submission.photo_url && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase">Attached Evidence Photo</span>
                  <div className="w-36 h-24 rounded-[8px] overflow-hidden border border-[var(--border-dim)] shadow-2xs">
                    <img
                      src={submission.photo_url}
                      alt="Complaint Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {submission.photo_description && (
                    <div className="mt-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
                        🤖 AI Photo Analysis
                      </p>
                      <p className="text-[13px] text-[var(--text-primary)]">
                        {submission.photo_description}
                      </p>
                      {submission.photo_safety_hazard && (
                        <p className="mt-1 text-[12px] font-bold text-red-500">
                          ⚠️ Safety hazard detected — flagged for urgent review
                        </p>
                      )}
                    </div>
                  )}
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
              className="w-full sm:w-auto h-11 px-5 rounded-[12px] border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  <span className="text-[var(--green)]">Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[var(--brand-secondary)]" />
                  <span>Share this report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNavigateToCitizen}
              className="w-full sm:w-auto h-11 px-6 rounded-[12px] text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:opacity-95 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
            >
              <span>Submit Another Grievance</span>
            </button>
          </div>

        </div>

        {/* RESTRAINED FOOTER NOTE */}
        <p className="text-center text-[12px] text-[var(--text-tertiary)] pt-2">
          NagarVaani Grievance Redressal Network • Powered by Gemini 3.7 Flash
        </p>

      </div>
    </div>
  );
}
