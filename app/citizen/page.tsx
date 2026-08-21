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
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import VoiceInput from "@/components/citizen/VoiceInput";

interface CitizenPageProps {
  onNewSubmission?: (sub: Submission) => void;
  onNavigateToDashboard?: () => void;
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
}: CitizenPageProps) {
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
    if (text.trim().length > 0) return 3;
    if (district.trim().length > 0) return 2;
    return 1;
  }, [submissionSuccessId, text, district]);

  // Voice Transcribe Callback
  const handleVoiceTranscribe = (transcribedEnglish: string, lang: string) => {
    setText((prev) => {
      const combined = prev ? `${prev.trim()} ${transcribedEnglish}` : transcribedEnglish;
      return combined.slice(0, 500);
    });
    setDetectedLanguage(lang || "English");
    setTextError("");
  };

  // Quick Prompt chip click
  const handleAppendPrompt = (promptText: string) => {
    setText((prev) => {
      if (!prev.trim()) return promptText;
      if (prev.includes(promptText)) return prev;
      return `${prev.trim()} ${promptText}`.slice(0, 500);
    });
    setTextError("");
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

  const handleResetForm = () => {
    setText("");
    setDistrict("");
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
        <div className="max-w-[600px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo Left */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#6366f1] flex items-center justify-center text-white shadow-2xs">
              <span className="text-[13px] font-bold">N</span>
            </div>
            <span className="text-[16px] font-bold tracking-tight text-[#1c1917]">
              NagarVaani
            </span>
          </div>

          {/* Right Controls: Language Selector + Policymaker Dashboard */}
          <div className="flex items-center gap-2">
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
      <main className="max-w-[600px] mx-auto px-6 py-8 space-y-6">
        {/* SUCCESS VIEW */}
        {submissionSuccessId ? (
          <div className="bg-[#ffffff] rounded-[16px] border border-[#e5e4e0] p-8 text-center space-y-6 shadow-sm animate-in fade-in duration-300">
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
              </div>
              <p className="text-[13px] text-[#78716c] pt-2">
                Your report will be reviewed within 48 hours
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto h-11 px-6 rounded-[12px] border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5f4] text-[#1c1917] text-[14px] font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Submit another report
              </button>

              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="w-full sm:w-auto h-11 px-6 rounded-[12px] text-white text-[14px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  }}
                >
                  <span>View Policymaker Dashboard</span>
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
                  onClick={() => handleSubmit()}
                  className="text-[12px] font-semibold underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* FORM CONTAINER WITH 12PX VERTICAL GAP */}
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
          </div>
        )}
      </main>
    </div>
  );
}
