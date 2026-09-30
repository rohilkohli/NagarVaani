'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Loader2, CheckCircle2, Globe, AlertCircle, RotateCcw, Edit3, Check } from "lucide-react";

export interface VoiceInputProps {
  onTranscribe: (text: string, language: string, originalText?: string) => void;
  disabled?: boolean;
  className?: string;
}

type RecordState = "idle" | "recording" | "processing" | "done";

export default function VoiceInput({
  onTranscribe,
  disabled = false,
  className = "",
}: VoiceInputProps) {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [audioBars, setAudioBars] = useState<number[]>(Array(24).fill(4));
  const [originalText, setOriginalText] = useState<string>("");
  const [englishTranslation, setEnglishTranslation] = useState<string>("");
  const [languageDetected, setLanguageDetected] = useState<string>("");
  const [editableTranscript, setEditableTranscript] = useState<string>("");
  const [editableLanguage, setEditableLanguage] = useState<string>("");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioBars(Array(24).fill(4));
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const numBars = 24;
        const newBars: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / numBars));

        for (let i = 0; i < numBars; i++) {
          const val = dataArray[i * step] || 0;
          const dynamicHeight = Math.min(40, Math.max(4, Math.round((val / 255) * 36 + 4)));
          newBars.push(dynamicHeight);
        }

        setAudioBars(newBars);
        animationFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch (err) {
      console.warn("Visualizer audio context note:", err);
    }
  };

  const handleStartRecording = async () => {
    if (disabled) return;
    setErrorMessage(null);
    audioChunksRef.current = [];
    setIsConfirmed(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      startVisualizer(stream);

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      }

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cleanupAudio();
        await handleProcessAudio();
      };

      mediaRecorder.start(250);
      setRecordState("recording");
    } catch (err: any) {
      cleanupAudio();
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : err.message || "Failed to start recording."
      );
      setRecordState("idle");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      setRecordState("processing");
      mediaRecorderRef.current.stop();
    }
  };

  const handleProcessAudio = async () => {
    setRecordState("processing");
    const audioBlob = new Blob(audioChunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || "audio/webm",
    });

    if (audioBlob.size < 100) {
      setErrorMessage("No audio detected. Please speak clearly into your phone/microphone.");
      setRecordState("idle");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      if (data.error && !data.original_text && !data.english_translation) {
        throw new Error(data.error);
      }

      const detectedLang = data.language_detected || "English";
      const transEnglish = data.english_translation || data.original_text || "";
      const transOrig = data.original_text || data.english_translation || "";

      setOriginalText(transOrig);
      setEnglishTranslation(transEnglish);
      setLanguageDetected(detectedLang);
      setEditableTranscript(transEnglish || transOrig);
      setEditableLanguage(detectedLang);
      setIsConfirmed(false);
      setRecordState("done");
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to transcribe audio. You can type below instead.");
      setRecordState("idle");
    }
  };

  const handleConfirmTranscript = () => {
    if (!editableTranscript.trim()) return;
    setIsConfirmed(true);
    onTranscribe(editableTranscript.trim(), editableLanguage.trim() || languageDetected, originalText);
  };

  const handleReset = () => {
    setRecordState("idle");
    setErrorMessage(null);
    setOriginalText("");
    setEnglishTranslation("");
    setLanguageDetected("");
    setEditableTranscript("");
    setEditableLanguage("");
    setIsConfirmed(false);
  };

  return (
    <div className={`space-y-4 font-sans ${className}`} id="citizen-voice-input">
      {/* HERO MIC BUTTON & INSTRUCTION */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-1">
        {recordState === "idle" && (
          <div className="flex flex-col items-center text-center space-y-2">
            <button
              type="button"
              id="hero-voice-button"
              disabled={disabled}
              onClick={handleStartRecording}
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 select-none bg-[#6366f1] hover:bg-[#4f46e5] shadow-lg shadow-[#6366f1]/30"
              title="Tap to speak in any language"
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
            <div className="space-y-0.5">
              <span className="text-[14px] font-semibold text-[var(--text-primary)] block">
                Tap to speak in any Indian language
              </span>
              <span className="text-[12px] text-[var(--text-secondary)] block">
                Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, English
              </span>
            </div>
          </div>
        )}

        {recordState === "recording" && (
          <div className="flex flex-col items-center text-center space-y-2">
            <button
              type="button"
              id="hero-voice-button-recording"
              onClick={handleStopRecording}
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white transition-all duration-200 cursor-pointer active:scale-95 select-none bg-red-600 hover:bg-red-700 ring-8 ring-red-500/20"
              title="Tap to finish recording"
            >
              <div className="w-6 h-6 rounded-[4px] bg-white animate-pulse" />
            </button>
            <div className="space-y-0.5">
              <span className="text-[14px] font-bold text-red-500 block">
                Listening... Tap when finished
              </span>
              <span className="text-[12px] text-[var(--text-secondary)] block">
                Gemini Voice AI transcribes and identifies your language
              </span>
            </div>
          </div>
        )}

        {recordState === "processing" && (
          <div className="flex flex-col items-center text-center space-y-2 py-2">
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white select-none bg-[#6366f1] shadow-lg shadow-[#6366f1]/25">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <span className="text-[13px] font-medium text-[#6366f1]">
              Transcribing & detecting language with Gemini AI...
            </span>
          </div>
        )}

        {recordState === "done" && (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Voice Transcribed</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-3.5 rounded-full border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Speak Again</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WAVEFORM VISUALIZER (24 bars in a row, 40px tall) */}
      <div className="w-full flex flex-col items-center justify-center pt-1">
        <div className="flex items-end justify-center gap-[3px] h-[40px] w-full max-w-[280px]">
          {audioBars.map((height, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-full transition-all duration-75"
              style={{
                height: `${height}px`,
                background: "linear-gradient(to top, #6366f1, #a855f7)",
                opacity: recordState === "recording" ? 1 : 0.45,
              }}
            />
          ))}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="p-3 rounded-[12px] bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-[13px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TRANSCRIPTION CONFIRMATION & EDIT PANEL */}
      {recordState === "done" && editableTranscript && (
        <div className="rounded-[12px] p-4 bg-[var(--bg-surface)] border border-[var(--brand-primary)]/30 space-y-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-2.5">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#6366f1]" />
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                Confirm or Edit Voice Transcript
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-tertiary)]">Detected Language:</span>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#6366f1] bg-[var(--brand-subtle)] px-2 py-0.5 rounded-[4px] border border-[var(--brand-primary)]/20">
                <Globe className="w-3 h-3" />
                <input
                  type="text"
                  value={editableLanguage}
                  onChange={(e) => setEditableLanguage(e.target.value)}
                  className="bg-transparent text-[#6366f1] font-bold text-[11px] w-20 outline-none"
                  title="Edit detected language"
                />
              </div>
            </div>
          </div>

          {/* Original Non-English Speech (if distinct) */}
          {originalText && originalText !== englishTranslation && (
            <div className="bg-[var(--bg-elevated)] p-2.5 rounded-[8px] border border-[var(--border-dim)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
                Original Spoken Voice:
              </span>
              <p className="text-[12px] text-[var(--text-secondary)] italic mt-0.5">
                "{originalText}"
              </p>
            </div>
          )}

          {/* Editable English Transcript */}
          <div>
            <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
              English Transcript (Citizen can edit before confirming):
            </label>
            <textarea
              rows={3}
              value={editableTranscript}
              onChange={(e) => {
                setEditableTranscript(e.target.value);
                setIsConfirmed(false);
              }}
              className="w-full text-[13px] p-2.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40"
              placeholder="Confirm or edit the transcribed text here..."
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            {isConfirmed ? (
              <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Transcript confirmed & populated into form!
              </span>
            ) : (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Please verify the transcription above before proceeding.
              </span>
            )}

            <button
              type="button"
              onClick={handleConfirmTranscript}
              className={`h-9 px-4 rounded-[8px] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                isConfirmed
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-md shadow-[#6366f1]/25"
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isConfirmed ? "Update in Form" : "Confirm & Use Transcript"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
