'use client';

import React, { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Globe,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Camera,
  Zap,
  FileText,
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import VoiceInput from "@/components/citizen/VoiceInput";
import NearYouPanel from "@/components/citizen/NearYouPanel";
import CommunityTab from "@/components/citizen/CommunityTab";

interface CitizenPageProps {
  onNewSubmission?: (sub: Submission) => void;
  onNavigateToDashboard?: () => void;
  onNavigateToTrack?: (trackingId: string) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const BRICS_COUNTRIES = [
  { id: "India", name: "India", flag: "🇮🇳", lat: 20.5937, lng: 78.9629 },
  { id: "Brazil", name: "Brazil", flag: "🇧🇷", lat: -14.235, lng: -51.9253 },
  { id: "Russia", name: "Russia", flag: "🇷🇺", lat: 61.524, lng: 105.3188 },
  { id: "South Africa", name: "S. Africa", flag: "🇿🇦", lat: -30.5595, lng: 22.9375 },
  { id: "China", name: "China", flag: "🇨🇳", lat: 35.8617, lng: 104.1954 },
];

const QUICK_PROMPTS = [
  { label: "🛣️ Broken road", text: "Severe potholes and damaged asphalt causing hazardous road conditions." },
  { label: "💧 No water supply", text: "No municipal tap water supply for past 3 days in our residential area." },
  { label: "⚡ Power cuts", text: "Frequent unscheduled electricity blackouts and voltage fluctuations." },
  { label: "🚽 Blocked drain", text: "Blocked municipal sewage drain overflowing on street causing health risks." },
];

const QUICK_CHIPS: { label: string; word: string; category: ComplaintCategory }[] = [
  { label: "Road", word: "Road", category: "roads" },
  { label: "Water", word: "Water", category: "water" },
  { label: "Electric", word: "Electric", category: "electricity" },
  { label: "Drain", word: "Drain", category: "sanitation" },
  { label: "Other", word: "Other", category: "other" },
];

const LANGUAGES = [
  { code: "en", name: "English", flag: "🌐" },
  { code: "hi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "mr", name: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
];

export default function CitizenPage({
  onNewSubmission,
  onNavigateToDashboard,
  onNavigateToTrack,
}: CitizenPageProps) {
  // Mode selection (Quick Report vs Full Report)
  const [citizenTab, setCitizenTab] = useState<"report" | "community">("report");
  const [reportMode, setReportMode] = useState<"quick" | "full">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nv_report_mode");
      if (saved === "quick" || saved === "full") return saved;
      return window.innerWidth < 768 ? "quick" : "full";
    }
    return "full";
  });

  const handleSetReportMode = (mode: "quick" | "full") => {
    setReportMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("nv_report_mode", mode);
    }
  };

  // Top bar language selector state
  const [currentLang, setCurrentLang] = useState<{ code: string; name: string; flag: string }>(LANGUAGES[0]);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  // SECTION 1: Location States
  const [country, setCountry] = useState<string>("India");
  const [state, setState] = useState<string>("Maharashtra");
  const [district, setDistrict] = useState<string>("");
  const [locationError, setLocationError] = useState<string>("");

  // SECTION 2: Voice & Text States
  const [detectedLanguage, setDetectedLanguage] = useState<string>("English");
  const [text, setText] = useState<string>("");
  const [textError, setTextError] = useState<string>("");

  // Quick Report Specific States
  const [quickLandmark, setQuickLandmark] = useState<string>("");
  const [quickText, setQuickText] = useState<string>("");
  const [quickCategory, setQuickCategory] = useState<ComplaintCategory | null>(null);
  const [quickError, setQuickError] = useState<string>("");
  const quickCameraInputRef = useRef<HTMLInputElement>(null);

  // SECTION 3: Photo Upload States
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SECTION 4: Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccessId, setSubmissionSuccessId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Step indicator calculation
  const currentStep = useMemo(() => {
    if (submissionSuccessId) return 3;
    if (text.trim().length > 0 || quickText.trim().length > 0) return 3;
    if (district.trim().length > 0 || quickLandmark.trim().length > 0) return 2;
    return 1;
  }, [submissionSuccessId, text, quickText, district, quickLandmark]);

  // Voice Transcribe Callback
  const handleVoiceTranscribe = (transcribedEnglish: string, lang: string) => {
    setText((prev) => {
      const combined = prev ? `${prev.trim()} ${transcribedEnglish}` : transcribedEnglish;
      return combined.slice(0, 500);
    });
    setDetectedLanguage(lang || "English");
    setTextError("");
  };

  // Quick Prompt chip click (Full Mode)
  const handleAppendPrompt = (promptText: string) => {
    setText((prev) => {
      if (!prev.trim()) return promptText;
      if (prev.includes(promptText)) return prev;
      return `${prev.trim()} ${promptText}`.slice(0, 500);
    });
    setTextError("");
  };

  // Quick Chip click (Quick Mode)
  const handleQuickChipClick = (chip: typeof QUICK_CHIPS[number]) => {
    setQuickCategory(chip.category);
    setQuickText((prev) => {
      if (!prev.trim()) return chip.word;
      if (prev.includes(chip.word)) return prev;
      return `${prev.trim()} - ${chip.word}`.slice(0, 200);
    });
    setQuickError("");
  };

  // Photo handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetPhoto(file);
  };

  const validateAndSetPhoto = (file?: File) => {
    setPhotoError("");
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Please upload a valid JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image size exceeds 5MB limit.");
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetPhoto(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLocationError("");
    setTextError("");
    setSubmissionError(null);

    let hasError = false;
    if (!district.trim()) {
      setLocationError("District / City name is required.");
      hasError = true;
    }
    if (!text.trim()) {
      setTextError("Please describe the infrastructure problem.");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      // 1. Upload photo if present
      let uploadedPhotoUrl = "";
      if (photoFile) {
        try {
          const fileExt = photoFile.name.split(".").pop() || "jpg";
          const fileName = `complaints/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const storageRef = ref(storage, fileName);
          const uploadSnapshot = await uploadBytes(storageRef, photoFile);
          uploadedPhotoUrl = await getDownloadURL(uploadSnapshot.ref);
        } catch (uploadErr) {
          console.warn("Storage upload note (prototype fallback):", uploadErr);
        }
      }

      // 2. Classify complaint using Gemini API
      let category: ComplaintCategory = "roads";
      let urgency: 1 | 2 | 3 | 4 | 5 = 3;
      let summaryEnglish: string = text;

      try {
        const classifyRes = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            language: detectedLanguage,
            district,
            state: country === "India" ? state : "",
            country,
          }),
        });

        if (classifyRes.ok) {
          const classifyData = await classifyRes.json();
          if (classifyData.category) category = classifyData.category;
          if (classifyData.urgency) {
            const rawUrg = Math.min(5, Math.max(1, Math.round(Number(classifyData.urgency) || 3))) as 1 | 2 | 3 | 4 | 5;
            urgency = rawUrg;
          }
          if (classifyData.summary_english) summaryEnglish = classifyData.summary_english;
        }
      } catch (err) {
        console.warn("Gemini classify notice:", err);
      }

      // 3. Approximate coordinates for mapping
      const countryMeta = BRICS_COUNTRIES.find((c) => c.name === country) || BRICS_COUNTRIES[0];
      const randomOffsetLat = (Math.random() - 0.5) * 4;
      const randomOffsetLng = (Math.random() - 0.5) * 4;
      const finalLat = Number((countryMeta.lat + randomOffsetLat).toFixed(4));
      const finalLng = Number((countryMeta.lng + randomOffsetLng).toFixed(4));

      const trackingCode = `NV-${Date.now().toString().slice(-6)}`;
      const newRecord: Submission = {
        id: trackingCode,
        text: text.trim(),
        language: detectedLanguage,
        category,
        urgency,
        summary_english: summaryEnglish,
        district: district.trim(),
        state: country === "India" ? state : "",
        country,
        lat: finalLat,
        lng: finalLng,
        photo_url: uploadedPhotoUrl || undefined,
        created_at: new Date(),
        status: "classified",
      };

      // 4. Save to Firestore
      try {
        const docRef = await addDoc(collection(db, "submissions"), {
          text: newRecord.text,
          language: newRecord.language,
          category: newRecord.category,
          urgency: newRecord.urgency,
          summary_english: newRecord.summary_english,
          district: newRecord.district,
          state: newRecord.state,
          country: newRecord.country,
          lat: newRecord.lat,
          lng: newRecord.lng,
          photo_url: newRecord.photo_url || null,
          created_at: newRecord.created_at.toISOString(),
          status: newRecord.status,
        });
        newRecord.id = `NV-${docRef.id.slice(0, 6).toUpperCase()}`;
      } catch (dbErr) {
        console.warn("Firestore save notice:", dbErr);
      }

      setSubmissionSuccessId(newRecord.id);

      if (onNewSubmission) {
        onNewSubmission(newRecord);
      }
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Report Mode Submit Handler (< 30s quick submission)
  const handleQuickSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setQuickError("");
    setSubmissionError(null);

    const hasContent = quickText.trim().length > 0 || !!photoFile || !!photoPreview;
    if (!hasContent) {
      setQuickError("Please capture/upload a photo or type a short one-line description.");
      return;
    }

    setIsSubmitting(true);

    const locationLabel = quickLandmark.trim() || "Local Area";
    const selectedCountryMeta = BRICS_COUNTRIES.find((c) => c.name === country) || BRICS_COUNTRIES[0];
    const randomOffsetLat = (Math.random() - 0.5) * 2;
    const randomOffsetLng = (Math.random() - 0.5) * 2;
    const finalLat = Number((selectedCountryMeta.lat + randomOffsetLat).toFixed(4));
    const finalLng = Number((selectedCountryMeta.lng + randomOffsetLng).toFixed(4));

    const trackingCode = `NV-${Date.now().toString().slice(-6)}`;
    const descriptionText =
      quickText.trim() || (photoFile ? "Attached photo of local infrastructure issue" : "Civic infrastructure issue reported");

    const newRecord: Submission = {
      id: trackingCode,
      text: descriptionText,
      language: "Detected",
      category: quickCategory || "other",
      urgency: 3,
      summary_english: descriptionText,
      district: locationLabel,
      state: country === "India" ? state : "",
      country,
      lat: finalLat,
      lng: finalLng,
      photo_url: photoPreview || undefined,
      created_at: new Date(),
      status: "classified",
    };

    // 1. Show success immediately to the user (instant <30s response)
    setDistrict(locationLabel);
    setSubmissionSuccessId(newRecord.id);
    if (onNewSubmission) {
      onNewSubmission(newRecord);
    }
    setIsSubmitting(false);

    // 2. Perform background processing (Storage upload, Gemini classify, and Firestore write)
    (async () => {
      try {
        let finalPhotoUrl = "";
        if (photoFile) {
          try {
            const fileExt = photoFile.name.split(".").pop() || "jpg";
            const fileName = `complaints/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const storageRef = ref(storage, fileName);
            const uploadSnapshot = await uploadBytes(storageRef, photoFile);
            finalPhotoUrl = await getDownloadURL(uploadSnapshot.ref);
            newRecord.photo_url = finalPhotoUrl;
          } catch (uploadErr) {
            console.warn("Storage upload notice (background):", uploadErr);
          }
        }

        // Background Gemini classification
        try {
          const classifyRes = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: descriptionText,
              language: "auto",
              district: locationLabel,
              state: country === "India" ? state : "",
              country,
            }),
          });

          if (classifyRes.ok) {
            const classifyData = await classifyRes.json();
            if (classifyData.category) newRecord.category = classifyData.category;
            if (classifyData.urgency) {
              newRecord.urgency = Math.min(5, Math.max(1, Math.round(Number(classifyData.urgency) || 3))) as 1 | 2 | 3 | 4 | 5;
            }
            if (classifyData.summary_english) newRecord.summary_english = classifyData.summary_english;
          }
        } catch (classifyErr) {
          console.warn("Background classify notice:", classifyErr);
        }

        // Firestore document creation
        try {
          const docRef = await addDoc(collection(db, "submissions"), {
            text: newRecord.text,
            language: newRecord.language,
            category: newRecord.category,
            urgency: newRecord.urgency,
            summary_english: newRecord.summary_english,
            district: newRecord.district,
            state: newRecord.state,
            country: newRecord.country,
            lat: newRecord.lat,
            lng: newRecord.lng,
            photo_url: finalPhotoUrl || null,
            created_at: newRecord.created_at.toISOString(),
            status: newRecord.status,
          });
          newRecord.id = `NV-${docRef.id.slice(0, 6).toUpperCase()}`;
        } catch (dbErr) {
          console.warn("Firestore save notice:", dbErr);
        }
      } catch (bgErr) {
        console.warn("Background sync error:", bgErr);
      }
    })();
  };

  const handleResetForm = () => {
    setText("");
    setDistrict("");
    setQuickLandmark("");
    setQuickText("");
    setQuickCategory(null);
    setQuickError("");
    handleRemovePhoto();
    setSubmissionSuccessId(null);
    setSubmissionError(null);
    setLocationError("");
    setTextError("");
  };

  // Character count color logic
  const charLength = text.length;
  const charColorClass =
    charLength >= 480
      ? "text-[#dc2626] font-bold"
      : charLength >= 400
      ? "text-[#d97706] font-semibold"
      : "text-[#78716c]";

  return (
    <div
      className="min-h-screen bg-[#fafaf9] text-[#1c1917] font-sans antialiased selection:bg-[#6366f1]/20 selection:text-[#1c1917]"
      id="citizen-portal-root"
    >
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="w-full bg-[#ffffff] border-b border-[#e5e4e0] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Logo Left */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-[8px] bg-[#6366f1] flex items-center justify-center text-white shadow-2xs">
              <span className="text-[13px] font-bold">N</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[#1c1917] hidden xs:inline">
              NagarVaani
            </span>
          </div>

          {/* Center: Tabs [📝 Report] [📍 Community] */}
          <div className="flex items-center gap-1 bg-[#f5f5f4] p-1 rounded-[10px] border border-[#e5e4e0]">
            <button
              type="button"
              id="tab-citizen-report"
              onClick={() => setCitizenTab("report")}
              className={`px-2.5 sm:px-3 py-1 rounded-[7px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                citizenTab === "report"
                  ? "bg-[#ffffff] text-[#1c1917] shadow-xs"
                  : "text-[#78716c] hover:text-[#1c1917]"
              }`}
            >
              <span>📝</span>
              <span>Report</span>
            </button>
            <button
              type="button"
              id="tab-citizen-community"
              onClick={() => setCitizenTab("community")}
              className={`px-2.5 sm:px-3 py-1 rounded-[7px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                citizenTab === "community"
                  ? "bg-[#ffffff] text-[#1c1917] shadow-xs"
                  : "text-[#78716c] hover:text-[#1c1917]"
              }`}
            >
              <span>📍</span>
              <span>Community</span>
            </button>
          </div>

          {/* Right Controls: Language Selector + Policymaker Dashboard */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                className="h-8 px-2.5 rounded-[8px] border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5f4] text-[#44403c] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <span>{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#78716c]" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-[10px] bg-[#ffffff] border border-[#e5e4e0] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-[#f5f5f4] transition-colors cursor-pointer ${
                        currentLang.code === lang.code
                          ? "font-bold text-[#6366f1] bg-[#f5f5ff]"
                          : "text-[#1c1917]"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dashboard Quick Switch */}
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="h-8 px-2.5 rounded-[8px] text-[12px] font-medium text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f5f4] transition-colors cursor-pointer"
              >
                Dashboard →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER (Max-width: 600px, centered, padding: 24px) */}
      {/* ========================================================================= */}
      <main className="max-w-[600px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {citizenTab === "community" ? (
          <CommunityTab
            currentCountry={country}
            onNavigateToReport={() => setCitizenTab("report")}
            onNavigateToTrack={onNavigateToTrack}
          />
        ) : submissionSuccessId ? (
          <div className="bg-[#ffffff] rounded-[16px] border border-[#e5e4e0] p-6 sm:p-8 text-center space-y-6 shadow-sm animate-in fade-in duration-300">
            {/* 7. SUBMISSION SUCCESS SELF-DRAWING SVG CHECKMARK */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center p-2">
                <svg className="w-20 h-20" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="animate-success-circle"
                  />
                  <path
                    d="M30 52 L44 66 L70 36"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-success-check"
                  />
                </svg>
              </div>
            </div>

            {/* Success Headlines */}
            <div className="space-y-2">
              <h2 className="text-[24px] font-bold text-[#1c1917] tracking-tight">
                Report Submitted!
              </h2>
              <div className="p-4 rounded-[12px] bg-[#f5f5ff] border border-[#e0e7ff] max-w-sm mx-auto space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6366f1] block">
                  TRACKING REFERENCE
                </span>
                <span className="font-mono text-[20px] font-bold text-[#6366f1] select-all block">
                  {submissionSuccessId}
                </span>
                <span className="text-[12px] text-[#78716c] block">
                  Location: {district}, {country}
                </span>
                <p className="text-[11px] text-[#6366f1] font-medium pt-1.5 border-t border-[#e0e7ff] mt-1">
                  Bookmark this page to track your complaint status
                </p>
              </div>
              <p className="text-[13px] text-[#78716c] pt-2">
                Your report will be reviewed within 48 hours
              </p>
            </div>

            {/* PART 1 — Post-submission "Near You" panel */}
            <NearYouPanel
              district={district}
              country={country}
              currentSubmissionId={submissionSuccessId}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="btn-track-report-success"
                onClick={() => {
                  if (onNavigateToTrack && submissionSuccessId) {
                    onNavigateToTrack(submissionSuccessId);
                  } else if (typeof window !== "undefined") {
                    window.location.href = `/?track=${encodeURIComponent(submissionSuccessId || "")}`;
                  }
                }}
                className="w-full sm:w-auto h-11 px-6 rounded-[12px] text-white text-[14px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-md hover:opacity-95 select-none"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                }}
              >
                <span>🔍 Track this report</span>
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto h-11 px-6 rounded-[12px] border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5f4] text-[#1c1917] text-[14px] font-semibold transition-colors cursor-pointer shadow-2xs select-none"
              >
                Submit another report
              </button>

              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="w-full sm:w-auto h-11 px-6 rounded-[12px] border border-[#e5e4e0] bg-[#fafaf9] hover:bg-[#f5f5f4] text-[#44403c] text-[14px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs select-none"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* MAIN FORM FLOW */
          <div className="space-y-6">
            {/* HEADER SECTION (above form cards) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6366f1] block">
                NAGARVAANI • CITIZEN PORTAL
              </span>
              <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.2] text-[#1c1917]">
                Report an Infrastructure Problem
              </h1>
              <p className="text-[15px] text-[#78716c]">
                Your voice shapes national priorities
              </p>
              {/* Decorative thin indigo line (2px × 40px) */}
              <div className="w-[40px] h-[2px] rounded-full bg-[#6366f1] mt-2" />
            </div>

            {/* STEP INDICATOR: Horizontal progress dots (① Where → ② What happened → ③ Submit) */}
            <div className="bg-[#ffffff] rounded-[12px] border border-[#e5e4e0] p-3 px-4 flex items-center justify-between shadow-2xs">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep > 1
                      ? "bg-[#6366f1] text-white"
                      : "bg-[#6366f1] text-white ring-2 ring-[#6366f1]/20"
                  }`}
                >
                  {currentStep > 1 ? "✓" : "1"}
                </div>
                <span
                  className={`text-[12px] font-medium hidden sm:inline ${
                    currentStep >= 1 ? "text-[#1c1917] font-semibold" : "text-[#78716c]"
                  }`}
                >
                  Where
                </span>
              </div>

              <div className="flex-1 h-[1px] bg-[#e5e4e0] mx-3" />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep > 2
                      ? "bg-[#6366f1] text-white"
                      : currentStep === 2
                      ? "bg-[#6366f1] text-white ring-2 ring-[#6366f1]/20"
                      : "bg-[#f5f5f4] text-[#78716c] border border-[#e5e4e0]"
                  }`}
                >
                  {currentStep > 2 ? "✓" : "2"}
                </div>
                <span
                  className={`text-[12px] font-medium hidden sm:inline ${
                    currentStep >= 2 ? "text-[#1c1917] font-semibold" : "text-[#78716c]"
                  }`}
                >
                  What happened
                </span>
              </div>

              <div className="flex-1 h-[1px] bg-[#e5e4e0] mx-3" />

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep === 3
                      ? "bg-[#6366f1] text-white ring-2 ring-[#6366f1]/20"
                      : "bg-[#f5f5f4] text-[#78716c] border border-[#e5e4e0]"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-[12px] font-medium hidden sm:inline ${
                    currentStep === 3 ? "text-[#1c1917] font-semibold" : "text-[#78716c]"
                  }`}
                >
                  Submit
                </span>
              </div>
            </div>

            {/* Error Notification */}
            {submissionError && (
              <div className="p-3.5 rounded-[12px] bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-[13px] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submissionError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => (reportMode === "quick" ? handleQuickSubmit() : handleSubmit())}
                  className="text-[12px] font-semibold underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* MODE TOGGLE ROW */}
            <div className="flex items-center justify-center p-1 bg-[#f5f5f4] border border-[#e5e4e0] rounded-[14px] max-w-sm mx-auto shadow-2xs">
              <button
                type="button"
                id="btn-mode-quick-report"
                onClick={() => handleSetReportMode("quick")}
                className={`flex-1 h-9 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none ${
                  reportMode === "quick"
                    ? "bg-white text-[#6366f1] shadow-2xs border border-[#e0e7ff]"
                    : "text-[#78716c] hover:text-[#1c1917]"
                }`}
              >
                <span>⚡</span>
                <span>Quick Report</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#f5f5ff] text-[#6366f1] font-mono font-bold hidden sm:inline">&lt;30s</span>
              </button>
              <button
                type="button"
                id="btn-mode-full-report"
                onClick={() => handleSetReportMode("full")}
                className={`flex-1 h-9 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none ${
                  reportMode === "full"
                    ? "bg-white text-[#6366f1] shadow-2xs border border-[#e0e7ff]"
                    : "text-[#78716c] hover:text-[#1c1917]"
                }`}
              >
                <span>📋</span>
                <span>Full Report</span>
              </button>
            </div>

            {reportMode === "quick" ? (
              /* ========================================================================= */
              /* QUICK REPORT MODE (Single Card) */
              /* ========================================================================= */
              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <div className="bg-[#ffffff] border border-[#e5e4e0] rounded-[16px] p-5 sm:p-6 space-y-5 shadow-2xs transition-all duration-200">
                  
                  {/* TOP: Location (Country selector flags + Landmark input) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-semibold text-[#78716c] uppercase tracking-[0.05em] block">
                        Select Country
                      </label>
                      <span className="text-[11px] font-medium text-[#6366f1]">Tap flag to switch</span>
                    </div>

                    {/* 5 Country flags */}
                    <div className="grid grid-cols-5 gap-2">
                      {BRICS_COUNTRIES.map((c) => {
                        const isSelected = country === c.name;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCountry(c.name)}
                            className={`h-[54px] rounded-[10px] flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                              isSelected
                                ? "bg-[#f5f5ff] border-2 border-[#6366f1] shadow-2xs"
                                : "bg-[#ffffff] border border-[#e5e4e0] hover:bg-[#fafaf9]"
                            }`}
                          >
                            <span className="text-[20px] leading-none mb-0.5">{c.flag}</span>
                            <span
                              className={`text-[9px] uppercase font-bold tracking-tight truncate w-full px-1 text-center ${
                                isSelected ? "text-[#6366f1]" : "text-[#78716c]"
                              }`}
                            >
                              {c.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Area / landmark text input */}
                    <div className="space-y-1 pt-1">
                      <label htmlFor="quick-landmark-input" className="text-[12px] font-semibold text-[#78716c]">
                        Your area / landmark
                      </label>
                      <input
                        id="quick-landmark-input"
                        type="text"
                        placeholder="e.g. Near Rajiv Chowk, Delhi"
                        value={quickLandmark}
                        onChange={(e) => setQuickLandmark(e.target.value)}
                        className="w-full h-11 rounded-[10px] border border-[#e5e4e0] bg-[#fafaf9] px-3.5 text-[15px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#6366f1] focus:bg-[#ffffff] transition-all"
                      />
                    </div>
                  </div>

                  {/* MIDDLE: Large camera/upload button (full-width, 120px tall) */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-[#78716c] uppercase tracking-[0.05em] block">
                      Photo Evidence (Recommended)
                    </label>

                    {/* Hidden Camera File Input */}
                    <input
                      ref={quickCameraInputRef}
                      type="file"
                      id="quick-camera-input"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {!photoPreview ? (
                      <div
                        onClick={() => quickCameraInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`h-[120px] w-full rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 select-none ${
                          isDragging
                            ? "border-[#6366f1] bg-[#f5f5ff]"
                            : "border-[#d4d4d4] bg-[#fafaf9] hover:border-[#6366f1] hover:bg-[#f5f5ff]"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center space-y-1.5 p-3">
                          <div className="w-10 h-10 rounded-full bg-[#f5f5ff] text-[#6366f1] flex items-center justify-center shadow-2xs">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div className="text-[14px] font-semibold text-[#1c1917]">
                            📷 Tap to photograph the problem
                          </div>
                          <div className="text-[11px] text-[#78716c]">
                            Direct camera on mobile, file upload on desktop
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-[10px] overflow-hidden border border-[#e5e4e0] bg-[#fafaf9] max-h-[160px] flex items-center justify-center">
                        <img
                          src={photoPreview}
                          alt="Problem Evidence"
                          className="w-full h-full max-h-[160px] object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          aria-label="Remove photo"
                          className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black text-white text-[11px] font-medium flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-md transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                      </div>
                    )}

                    {photoError && (
                      <p className="text-[12px] text-[#ef4444] font-medium">{photoError}</p>
                    )}
                  </div>

                  {/* BELOW PHOTO: Single textarea (2 rows) + Quick Chips */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="quick-text-input" className="text-[12px] font-semibold text-[#78716c]">
                        Describe in one line — any language
                      </label>
                      <span className="text-[11px] font-mono text-[#78716c]">
                        {quickText.length} / 200
                      </span>
                    </div>

                    <textarea
                      id="quick-text-input"
                      rows={2}
                      maxLength={200}
                      placeholder="Describe in one line — any language"
                      value={quickText}
                      onChange={(e) => {
                        setQuickText(e.target.value);
                        setQuickError("");
                      }}
                      className="w-full rounded-[10px] border border-[#e5e4e0] bg-[#fafaf9] p-3 text-[15px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#6366f1] focus:bg-[#ffffff] transition-all resize-none leading-normal"
                    />

                    {/* Quick chip buttons: [Road] [Water] [Electric] [Drain] [Other] */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.05em] block">
                        Quick Category:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {QUICK_CHIPS.map((chip) => {
                          const isSelected = quickCategory === chip.category;
                          return (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => handleQuickChipClick(chip)}
                              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer select-none ${
                                isSelected
                                  ? "bg-[#6366f1] text-white shadow-2xs"
                                  : "bg-[#fafaf9] border border-[#e5e4e0] text-[#44403c] hover:bg-[#f5f5ff] hover:border-[#6366f1]/40"
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {quickError && (
                      <p className="text-[12px] text-[#ef4444] font-medium pt-1">{quickError}</p>
                    )}
                  </div>

                  {/* BOTTOM: Large submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btn-quick-submit"
                      disabled={isSubmitting}
                      className="w-full h-[52px] rounded-[12px] text-white text-[16px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 select-none hover:-translate-y-[0.5px] active:translate-y-0 shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #818cf8)",
                        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Submitting Report...</span>
                        </>
                      ) : (
                        <>
                          <span>Report This Problem →</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </form>
            ) : (
              /* ========================================================================= */
              /* FULL REPORT MODE (4 Cards) */
              /* ========================================================================= */
              <form onSubmit={handleSubmit} className="space-y-[12px]">
                {/* ========================================================================= */}
                {/* CARD 1 — LOCATION */}
                {/* ========================================================================= */}
                <div className="bg-[#ffffff] border border-[#e5e4e0] rounded-[16px] p-5 sm:p-6 space-y-4 shadow-2xs transition-all duration-200 focus-within:ring-2 focus-within:ring-[#6366f1]/30 focus-within:border-[#6366f1]">
                {/* Header */}
                <div className="flex items-center gap-2.5 border-b border-[#f5f5f4] pb-3">
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#f5f5ff] text-[#6366f1] border border-[#e0e7ff] text-[11px] font-mono font-bold">
                    01
                  </span>
                  <h3 className="text-[16px] font-bold text-[#1c1917]">
                    Select Your Location
                  </h3>
                </div>

                {/* Country Flag Cards: 5 in a row */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78716c] uppercase tracking-[0.05em] block">
                    BRICS Nation
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {BRICS_COUNTRIES.map((c) => {
                      const isSelected = country === c.name;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCountry(c.name);
                            setLocationError("");
                          }}
                          className={`h-[60px] rounded-[12px] flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                            isSelected
                              ? "bg-[#f5f5ff] border-2 border-[#6366f1] shadow-2xs"
                              : "bg-[#ffffff] border border-[#e5e4e0] hover:bg-[#fafaf9]"
                          }`}
                        >
                          <span className="text-[24px] leading-none mb-1">{c.flag}</span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-tight truncate w-full px-1 text-center ${
                              isSelected ? "text-[#6366f1]" : "text-[#78716c]"
                            }`}
                          >
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* India Specific State Dropdown + District input */}
                <div className="space-y-3 pt-1">
                  {country === "India" && (
                    <div className="space-y-1 animate-in fade-in duration-200">
                      <label htmlFor="state-select" className="text-[12px] font-semibold text-[#78716c]">
                        State (India)
                      </label>
                      <select
                        id="state-select"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 rounded-[10px] border border-[#e5e4e0] bg-[#fafaf9] px-3.5 text-[15px] text-[#1c1917] focus:outline-none focus:border-[#6366f1] focus:bg-[#ffffff] transition-all cursor-pointer"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* District Input (16px to prevent iOS zoom) */}
                  <div className="space-y-1">
                    <label htmlFor="district-input" className="text-[12px] font-semibold text-[#78716c]">
                      District / City <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      id="district-input"
                      type="text"
                      placeholder="e.g. Pune, Mumbai, Bengaluru, Cape Town..."
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setLocationError("");
                      }}
                      className="w-full h-11 rounded-[10px] border border-[#e5e4e0] bg-[#fafaf9] px-3.5 text-[16px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#6366f1] focus:bg-[#ffffff] transition-all"
                      required
                    />
                    {locationError && (
                      <p className="text-[12px] text-[#ef4444] font-medium mt-1">{locationError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* CARD 2 — VOICE INPUT */}
              {/* ========================================================================= */}
              <div className="bg-[#ffffff] border border-[#e5e4e0] rounded-[16px] p-5 sm:p-6 space-y-4 shadow-2xs transition-all duration-200 focus-within:ring-2 focus-within:ring-[#6366f1]/30 focus-within:border-[#6366f1]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#f5f5f4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#f5f5ff] text-[#6366f1] border border-[#e0e7ff] text-[11px] font-mono font-bold">
                      02
                    </span>
                    <h3 className="text-[16px] font-bold text-[#1c1917]">
                      Voice Input (Optional)
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6366f1] bg-[#f5f5ff] px-2 py-0.5 rounded-[4px]">
                    Gemini AI
                  </span>
                </div>

                <VoiceInput
                  onTranscribe={handleVoiceTranscribe}
                  disabled={isSubmitting}
                />
              </div>

              {/* ========================================================================= */}
              {/* CARD 3 — TEXT INPUT */}
              {/* ========================================================================= */}
              <div className="bg-[#ffffff] border border-[#e5e4e0] rounded-[16px] p-5 sm:p-6 space-y-3.5 shadow-2xs transition-all duration-200 focus-within:ring-2 focus-within:ring-[#6366f1]/30 focus-within:border-[#6366f1]">
                {/* Header */}
                <div className="flex items-center gap-2.5 border-b border-[#f5f5f4] pb-3">
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#f5f5ff] text-[#6366f1] border border-[#e0e7ff] text-[11px] font-mono font-bold">
                    03
                  </span>
                  <h3 className="text-[16px] font-bold text-[#1c1917]">
                    Describe the Problem <span className="text-[#ef4444]">*</span>
                  </h3>
                </div>

                {/* Textarea */}
                <textarea
                  id="complaint-text"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe what happened in your local words (broken road, burst water main, power outage, sanitation hazard)..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setTextError("");
                  }}
                  className="w-full min-h-[120px] rounded-[10px] border border-[#e5e4e0] bg-[#fafaf9] p-3.5 text-[16px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#6366f1] focus:bg-[#ffffff] transition-all resize-y leading-relaxed"
                  required
                />

                {/* Bottom Row: Language support indicator (Left) + Character count (Right) */}
                <div className="flex items-center justify-between text-[12px] pt-0.5">
                  <div className="flex items-center gap-1.5 text-[#78716c]">
                    <Globe className="w-3.5 h-3.5 text-[#78716c]" />
                    <span className="text-[11px] font-medium">Supports all languages</span>
                  </div>
                  <span className={`text-[12px] font-mono ${charColorClass}`}>
                    {charLength} / 500
                  </span>
                </div>

                {textError && (
                  <p className="text-[12px] text-[#ef4444] font-medium">{textError}</p>
                )}

                {/* Clickable Example Prompt Chips */}
                <div className="space-y-1.5 pt-1 border-t border-[#f5f5f4]">
                  <span className="text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.05em] block">
                    Quick suggestions:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleAppendPrompt(prompt.text)}
                        className="px-3 py-1.5 rounded-[8px] border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5ff] hover:border-[#6366f1]/40 text-[#44403c] text-[12px] font-medium transition-all duration-150 cursor-pointer shadow-2xs"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* CARD 4 — PHOTO */}
              {/* ========================================================================= */}
              <div className="bg-[#ffffff] border border-[#e5e4e0] rounded-[16px] p-5 sm:p-6 space-y-3.5 shadow-2xs transition-all duration-200 focus-within:ring-2 focus-within:ring-[#6366f1]/30 focus-within:border-[#6366f1]">
                {/* Header */}
                <div className="flex items-center gap-2.5 border-b border-[#f5f5f4] pb-3">
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#f5f5ff] text-[#6366f1] border border-[#e0e7ff] text-[11px] font-mono font-bold">
                    04
                  </span>
                  <h3 className="text-[16px] font-bold text-[#1c1917]">
                    Attach Photo (Optional)
                  </h3>
                </div>

                {/* Drag Zone (Height: 120px) or Image Preview */}
                {!photoPreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-[120px] rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 select-none ${
                      isDragging
                        ? "border-[#6366f1] bg-[#f5f5ff]"
                        : "border-[#d4d4d4] bg-[#fafaf9] hover:border-[#6366f1] hover:bg-[#f5f5ff]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="photo-file-input"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center space-y-1">
                      <UploadCloud className="w-6 h-6 text-[#78716c]" />
                      <div className="text-[13px] font-semibold text-[#1c1917]">
                        Drop photo here
                      </div>
                      <div className="text-[11px] text-[#78716c]">
                        or tap to browse (JPEG, PNG, max 5MB)
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Uploaded Image Preview */
                  <div className="relative rounded-[8px] overflow-hidden border border-[#e5e4e0] bg-[#fafaf9]">
                    <img
                      src={photoPreview}
                      alt="Uploaded Infrastructure Damage"
                      className="w-full max-h-[200px] object-cover"
                    />
                    {/* Top-right overlay close button (24px white circle) */}
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      aria-label="Remove image"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-[#1c1917] hover:text-[#ef4444] hover:scale-105 flex items-center justify-center shadow-md text-[12px] font-bold cursor-pointer transition-transform"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {photoError && (
                  <p className="text-[12px] text-[#ef4444] font-medium">{photoError}</p>
                )}
              </div>

              {/* ========================================================================= */}
              {/* SUBMIT BUTTON */}
              {/* ========================================================================= */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-submit-citizen-report"
                  disabled={isSubmitting}
                  className="w-full h-[52px] rounded-[12px] text-white text-[16px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 select-none hover:-translate-y-[1px] active:translate-y-0 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Classifying & Submitting Report...</span>
                    </>
                  ) : (
                    <span>Submit Infrastructure Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
          </div>
        )}
      </main>
    </div>
  );
}
