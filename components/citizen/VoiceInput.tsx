'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Loader2, CheckCircle2, Globe, AlertCircle, RotateCcw } from "lucide-react";

export interface VoiceInputProps {
  onTranscribe: (text: string, language: string) => void;
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
          // Scale 0-255 to 4px - 40px
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
      setRecordState("done");

      if (transEnglish) {
        onTranscribe(transEnglish, detectedLang);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to transcribe audio. You can type below instead.");
      setRecordState("idle");
    }
  };

  const handleReset = () => {
    setRecordState("idle");
    setErrorMessage(null);
    setOriginalText("");
    setEnglishTranslation("");
    setLanguageDetected("");
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
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 select-none"
              style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
              }}
              title="Tap to speak in any language"
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
            <div className="space-y-0.5">
              <span className="text-[14px] font-semibold text-[#1c1917] block">
                Tap to speak in any language
              </span>
              <span className="text-[12px] text-[#78716c] block">
                Hindi, Tamil, Marathi, Russian, Portuguese, etc.
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
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white transition-all duration-200 cursor-pointer active:scale-95 select-none"
              style={{
                background: "linear-gradient(135deg, #ef4444, #f87171)",
                boxShadow: "0 0 0 8px rgba(239, 68, 68, 0.15), 0 0 0 16px rgba(239, 68, 68, 0.07)",
              }}
              title="Tap to finish recording"
            >
              <div className="w-6 h-6 rounded-[4px] bg-white animate-pulse" />
            </button>
            <div className="space-y-0.5">
              <span className="text-[14px] font-bold text-[#ef4444] block">
                Listening... Tap when finished
              </span>
              <span className="text-[12px] text-[#78716c] block">
                AI transcribes and summarizes automatically
              </span>
            </div>
          </div>
        )}

        {recordState === "processing" && (
          <div className="flex flex-col items-center text-center space-y-2 py-2">
            <div
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white select-none"
              style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.25)",
              }}
            >
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <span className="text-[13px] font-medium text-[#6366f1]">
              Transcribing with Gemini Voice AI...
            </span>
          </div>
        )}

        {recordState === "done" && (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 px-4 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-[13px] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>Voice Transcribed</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-3.5 rounded-full border border-[#e5e4e0] bg-[#ffffff] hover:bg-[#f5f5f4] text-[#44403c] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#78716c]" />
                <span>Speak Again</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WAVEFORM VISUALIZER (24 bars in a row, 40px tall, indigo -> violet gradient) */}
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
        <div className="p-3 rounded-[12px] bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-[13px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TRANSCRIPTION RESULT BOX */}
      {(englishTranslation || originalText) && (
        <div
          className="rounded-[10px] space-y-1.5 animate-in fade-in duration-200"
          style={{
            background: "#f5f5ff",
            borderLeft: "3px solid #6366f1",
            padding: "12px 16px",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6366f1] bg-[#ffffff] px-2 py-0.5 rounded-[4px] border border-[#e0e7ff]">
              <Globe className="w-3 h-3" />
              {languageDetected || "Detected Language"}
            </span>
            <span className="text-[11px] font-medium text-[#059669]">
              ✓ Populated in form
            </span>
          </div>

          <p className="text-[14px] text-[#1c1917] font-medium leading-relaxed">
            "{englishTranslation || originalText}"
          </p>

          {originalText && originalText !== englishTranslation && (
            <p className="text-[12px] text-[#78716c] italic leading-relaxed pt-1 border-t border-[#e0e7ff]">
              Original: "{originalText}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
