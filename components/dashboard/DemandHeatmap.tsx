'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import {
  Layers,
} from "lucide-react";
import { Submission } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface DemandHeatmapProps {
  submissions?: Submission[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  isLoading?: boolean;
  className?: string;
}

const CATEGORY_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "roads", label: "Roads" },
  { key: "water", label: "Water" },
  { key: "electricity", label: "Electricity" },
  { key: "sanitation", label: "Sanitation" },
  { key: "health", label: "Health" },
  { key: "education", label: "Education" },
];

const initialCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const initialZoom = 5;

const HEATMAP_COLOR_RANGE: [number, number, number, number][] = [
  [99, 102, 241, 30],   // indigo-violet subtle
  [56, 189, 248, 100],  // cyan
  [251, 191, 36, 160],  // amber
  [249, 115, 22, 210],  // orange
  [239, 68, 68, 255],   // red
];

// Dark mode styles for Google Maps matching #0a0a0f and #111118
const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#111118" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8b9e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f4f4f6" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "rgba(255, 255, 255, 0.14)" }, { weight: 1.2 }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "rgba(255, 255, 255, 0.07)" }, { weight: 0.8 }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a1a26" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#111118" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#242436" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#07070a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#525266" }],
  },
];

export default function DemandHeatmap({
  submissions: initialSubmissions = [],
  selectedCategory,
  onCategoryChange,
  isLoading = false,
  className = "",
}: DemandHeatmapProps) {
  const [internalCategory, setInternalCategory] = useState<string>("all");
  const categoryFilter = selectedCategory !== undefined ? selectedCategory : internalCategory;

  const handleCategorySelect = (catKey: string) => {
    if (onCategoryChange) {
      onCategoryChange(catKey);
    } else {
      setInternalCategory(catKey);
    }
  };

  const [realtimeSubmissions, setRealtimeSubmissions] = useState<Submission[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const deckOverlayRef = useRef<GoogleMapsOverlay | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = collection(db, "submissions");
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data: Submission[] = snapshot.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                text: d.text || "",
                language: d.language || "English",
                category: d.category || "roads",
                urgency: d.urgency || 3,
                summary_english: d.summary_english || d.text || "",
                district: d.district || "",
                state: d.state || "",
                country: d.country || "India",
                lat: d.lat || 20.5937,
                lng: d.lng || 78.9629,
                photo_url: d.photo_url || undefined,
                created_at: d.created_at ? new Date(d.created_at) : new Date(),
                status: d.status || "classified",
              };
            });
            setRealtimeSubmissions(data);
          } else if (initialSubmissions.length > 0) {
            setRealtimeSubmissions(initialSubmissions);
          }
        },
        () => {
          if (initialSubmissions.length > 0) {
            setRealtimeSubmissions(initialSubmissions);
          }
        }
      );
    } catch (e) {
      if (initialSubmissions.length > 0) {
        setRealtimeSubmissions(initialSubmissions);
      }
    }

    return () => unsubscribe();
  }, [initialSubmissions]);

  useEffect(() => {
    if (initialSubmissions.length > 0 && realtimeSubmissions.length === 0) {
      setRealtimeSubmissions(initialSubmissions);
    }
  }, [initialSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const source = realtimeSubmissions.length > 0 ? realtimeSubmissions : initialSubmissions;
    if (categoryFilter === "all") {
      return source;
    }
    return source.filter(
      (s) => s.category?.toLowerCase() === categoryFilter.toLowerCase()
    );
  }, [realtimeSubmissions, initialSubmissions, categoryFilter]);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (typeof window !== "undefined" && (window as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) ||
    "";

  const { isLoaded } = useJsApiLoader({
    id: "nagarvaani-google-maps-script",
    googleMapsApiKey: apiKey,
  });

  const updateDeckOverlay = useCallback(() => {
    if (!deckOverlayRef.current) return;

    const layer = new HeatmapLayer({
      id: "demand-heatmap-layer",
      data: filteredSubmissions,
      getPosition: (d: Submission) => [d.lng, d.lat],
      getWeight: (d: Submission) => d.urgency || 1,
      radiusPixels: 60,
      intensity: 3,
      threshold: 0.05,
      colorRange: HEATMAP_COLOR_RANGE,
      pickable: false,
    });

    deckOverlayRef.current.setProps({
      layers: [layer],
    });
  }, [filteredSubmissions]);

  useEffect(() => {
    updateDeckOverlay();
  }, [updateDeckOverlay]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (!deckOverlayRef.current) {
        const overlay = new GoogleMapsOverlay({
          layers: [],
        });
        overlay.setMap(map);
        deckOverlayRef.current = overlay;
      }
      updateDeckOverlay();
    },
    [updateDeckOverlay]
  );

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] overflow-hidden flex flex-col p-0 card-hover-lift hover:border-[var(--border-base)] ${className}`}
      id="demand-heatmap-card"
    >
      {/* HEADER BAR (Inside Card, 44px height, padding: 12px 16px) */}
      <div className="h-[44px] min-h-[44px] px-4 flex items-center justify-between border-b border-[var(--border-dim)] bg-[var(--bg-surface)] shrink-0">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
          Demand Heatmap
        </h3>

        {/* Filter Pills (24px height, 8px horizontal padding, 6px gap) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategorySelect(cat.key)}
                className={`h-6 px-2 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center justify-center ${
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-xs"
                    : "bg-transparent border border-[var(--border-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAP ITSELF (Height: 420px, border-radius: 0 0 14px 14px, entrance fade-in) */}
      <div className="relative w-full h-[420px] bg-[var(--bg-base)] overflow-hidden rounded-b-[14px] heatmap-enter">
        {/* Loading skeleton exact container shape */}
        {isLoading && initialSubmissions.length === 0 ? (
          <div className="w-full h-full skeleton-shimmer" />
        ) : isLoaded && apiKey ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "420px" }}
            center={initialCenter}
            zoom={initialZoom}
            options={{
              styles: DARK_MAP_STYLES,
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
            onLoad={onMapLoad}
          />
        ) : (
          /* High-Fidelity Canvas Vector Heatmap Layer */
          <div className="relative w-full h-full bg-[var(--bg-base)] flex flex-col items-center justify-center p-4 select-none">
            {/* World Vector Blueprint */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60"
              viewBox="0 0 1000 420"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern
                  id="grid-dots"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
                </pattern>
                <radialGradient id="heat-india" cx="55%" cy="48%" r="18%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="35%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-brazil" cx="28%" cy="65%" r="14%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-safrica" cx="48%" cy="75%" r="12%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-china" cx="68%" cy="42%" r="15%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-russia" cx="62%" cy="25%" r="16%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Background */}
              <rect width="1000" height="420" fill="url(#grid-dots)" />

              {/* Heat Density Overlays */}
              <circle cx="550" cy="200" r="160" fill="url(#heat-india)" />
              <circle cx="280" cy="270" r="130" fill="url(#heat-brazil)" />
              <circle cx="480" cy="315" r="110" fill="url(#heat-safrica)" />
              <circle cx="680" cy="175" r="140" fill="url(#heat-china)" />
              <circle cx="620" cy="105" r="140" fill="url(#heat-russia)" />
            </svg>

            {/* Pulsing Coordinates Nodes */}
            <div className="absolute top-[48%] left-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-[var(--red)] ring-4 ring-[var(--red)]/20 animate-ping" />
              <span className="mt-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-elevated)]/90 border border-[var(--border-base)] text-[10px] font-mono text-white">
                India (High Triage)
              </span>
            </div>

            <div className="absolute top-[65%] left-[28%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--amber)] ring-4 ring-[var(--amber)]/20 animate-pulse" />
              <span className="mt-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-elevated)]/90 border border-[var(--border-base)] text-[10px] font-mono text-white">
                Brazil
              </span>
            </div>

            <div className="absolute top-[75%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--red)] ring-4 ring-[var(--red)]/20 animate-pulse" />
              <span className="mt-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-elevated)]/90 border border-[var(--border-base)] text-[10px] font-mono text-white">
                S. Africa
              </span>
            </div>

            {/* Bottom Status Pill */}
            <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)]/90 border border-[var(--border-base)] text-[11px] font-mono text-[var(--text-secondary)] backdrop-blur-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] live-pulse" />
              <span>{filteredSubmissions.length} Geospatial Vector Coordinates</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
