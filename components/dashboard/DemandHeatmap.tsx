'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { Map as MapIcon, Layers, Info } from "lucide-react";
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

const CATEGORY_COLORS: Record<string, string> = {
  roads: "#ef4444",
  water: "#38bdf8",
  electricity: "#fbbf24",
  sanitation: "#f97316",
  health: "#ec4899",
  education: "#a855f7",
  other: "#94a3b8",
};

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

  // Check if Maps API key exists
  const mapsKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof window !== "undefined" && ((window as any).__ENV?.VITE_GOOGLE_MAPS_API_KEY || (window as any).VITE_GOOGLE_MAPS_API_KEY || (window as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)) ||
    "AIzaSyDeh5qMcJgn5Rlxs0oYT8PCFKvICz7YoI0";
  const hasMapsKey = Boolean(mapsKey && mapsKey.length > 10);

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

  const { isLoaded } = useJsApiLoader({
    id: "nagarvaani-google-maps-script",
    googleMapsApiKey: hasMapsKey ? mapsKey : "",
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
    if (hasMapsKey && isLoaded) {
      updateDeckOverlay();
    }
  }, [updateDeckOverlay, hasMapsKey, isLoaded]);

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

  // Group submissions by lat/lng quadrant into a 10×10 grid of cells for no-key fallback
  const gridCells = useMemo(() => {
    const source = filteredSubmissions.length > 0 ? filteredSubmissions : initialSubmissions;
    const grid: {
      count: number;
      categoryCounts: Record<string, number>;
      dominantCategory: string;
      dominantColor: string;
      districts: Set<string>;
    }[][] = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => ({
        count: 0,
        categoryCounts: {},
        dominantCategory: "roads",
        dominantColor: "#ef4444",
        districts: new Set<string>(),
      }))
    );

    const lats = source.map((s) => s.lat).filter((n): n is number => typeof n === "number" && !isNaN(n));
    const lngs = source.map((s) => s.lng).filter((n): n is number => typeof n === "number" && !isNaN(n));
    const minLat = lats.length ? Math.min(...lats) : 8;
    const maxLat = lats.length ? Math.max(...lats) : 37;
    const minLng = lngs.length ? Math.min(...lngs) : 68;
    const maxLng = lngs.length ? Math.max(...lngs) : 97;

    const latSpan = maxLat - minLat || 1;
    const lngSpan = maxLng - minLng || 1;

    source.forEach((s) => {
      const sLat = typeof s.lat === "number" ? s.lat : 20.5937;
      const sLng = typeof s.lng === "number" ? s.lng : 78.9629;
      const latNorm = Math.min(9, Math.max(0, Math.floor(((sLat - minLat) / latSpan) * 9.99)));
      const lngNorm = Math.min(9, Math.max(0, Math.floor(((sLng - minLng) / lngSpan) * 9.99)));
      const row = 9 - latNorm; // Row 0 is top (maxLat), Row 9 is bottom (minLat)
      const col = lngNorm;

      const cell = grid[row][col];
      cell.count += 1;
      const cat = (s.category || "other").toLowerCase();
      cell.categoryCounts[cat] = (cell.categoryCounts[cat] || 0) + 1;
      if (s.district) {
        cell.districts.add(s.district);
      }
    });

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = grid[r][c];
        if (cell.count > 0) {
          let maxCount = 0;
          let topCat = "roads";
          Object.entries(cell.categoryCounts).forEach(([cat, cnt]) => {
            if (cnt > maxCount) {
              maxCount = cnt;
              topCat = cat;
            }
          });
          cell.dominantCategory = topCat;
          cell.dominantColor = CATEGORY_COLORS[topCat] || "#6366f1";
        }
      }
    }

    return grid;
  }, [filteredSubmissions, initialSubmissions]);

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-[var(--radius-md)] overflow-hidden flex flex-col p-0 card-hover-lift hover:border-[var(--border-base)] ${className}`}
      id="demand-heatmap-card"
    >
      {/* HEADER BAR (Inside Card, 44px height, padding: 12px 16px) */}
      <div className="h-[44px] min-h-[44px] px-4 flex items-center justify-between border-b border-[var(--border-dim)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--brand-secondary)]" />
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
            Demand Heatmap
          </h3>
        </div>

        {/* Filter Pills */}
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

      {/* MAP / FALLBACK CONTAINER */}
      {hasMapsKey && isLoaded ? (
        <div className="relative w-full h-[456px] bg-[var(--bg-base)] overflow-hidden rounded-b-[var(--radius-md)] heatmap-enter">
          {isLoading && initialSubmissions.length === 0 ? (
            <div className="w-full h-full skeleton-shimmer" />
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "456px" }}
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
          )}
        </div>
      ) : (
        /* STEP 2: STYLED 500PX FALLBACK WHEN NO MAPS KEY */
        <div
          className="relative w-full min-h-[500px] h-[500px] flex flex-col justify-between p-6 select-none overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))",
            border: "1px solid var(--border-base)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Header info in center top */}
          <div className="flex flex-col items-center text-center space-y-1.5 z-10">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-center shadow-inner mb-1">
              <MapIcon className="w-6 h-6 text-[var(--text-tertiary)]" style={{ width: 40, height: 40 }} />
            </div>
            <h3 className="text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
              Demand Heatmap
            </h3>
            <p className="text-[13px] text-[var(--text-tertiary)] max-w-md font-normal">
              Add <code className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-base)] border border-[var(--border-dim)] text-[var(--brand-secondary)] font-mono text-[12px]">VITE_GOOGLE_MAPS_API_KEY</code> to enable the live map
            </p>
          </div>

          {/* 10x10 Dot Grid Visualizer */}
          <div className="my-auto py-2 flex flex-col items-center justify-center z-10">
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-base)]/80 border border-[var(--border-dim)] backdrop-blur-xs shadow-lg">
              <div className="grid grid-cols-10 gap-2.5 sm:gap-3.5">
                {gridCells.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const hasData = cell.count > 0;
                    const sizePx = hasData
                      ? Math.min(22, Math.max(8, 7 + cell.count * 2.5))
                      : 4;

                    return (
                      <div
                        key={`cell-${rIdx}-${cIdx}`}
                        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center relative group"
                      >
                        <div
                          className={`rounded-full transition-all duration-200 ${
                            hasData ? "shadow-xs group-hover:scale-125" : "bg-white/10"
                          }`}
                          style={{
                            width: `${sizePx}px`,
                            height: `${sizePx}px`,
                            backgroundColor: hasData ? cell.dominantColor : "rgba(255, 255, 255, 0.08)",
                            boxShadow: hasData
                              ? `0 0 10px ${cell.dominantColor}55`
                              : undefined,
                          }}
                        />

                        {/* Interactive Tooltip on Hover */}
                        {hasData && (
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 px-2 py-1 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-base)] shadow-md whitespace-nowrap text-[10px] text-[var(--text-primary)]">
                            <span className="font-semibold capitalize text-white">
                              {cell.dominantCategory}
                            </span>
                            : {cell.count} report{cell.count > 1 ? "s" : ""}
                            {cell.districts.size > 0 && (
                              <span className="text-[var(--text-tertiary)] block text-[9px]">
                                {Array.from(cell.districts).slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footnote & Category Dot Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-dim)] z-10">
            <div className="flex items-center gap-1.5 font-mono">
              <Info className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
              <span>{filteredSubmissions.length} Geospatial Telemetry Points in Grid</span>
            </div>

            <div className="flex items-center gap-3">
              {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize text-[11px] text-[var(--text-secondary)]">
                    {cat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
