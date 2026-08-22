'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  ThumbsUp,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Droplets,
  Zap,
  Trash2,
  HeartPulse,
  GraduationCap,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { getLocationCoordinates } from "@/lib/locations";

interface CommunityMapExplorerProps {
  submissions: Submission[];
  selectedCountry: string;
  selectedCategory: string;
  onUpvote: (submission: Submission) => void;
  upvotedIds: Set<string>;
  onNavigateToTrack?: (trackingId: string) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  roads: "#ef4444",
  water: "#0284c7",
  electricity: "#d97706",
  sanitation: "#9333ea",
  health: "#e11d48",
  education: "#059669",
  other: "#4f46e5",
};

const CATEGORY_ICONS: Record<string, any> = {
  roads: Compass,
  water: Droplets,
  electricity: Zap,
  sanitation: Trash2,
  health: HeartPulse,
  education: GraduationCap,
  other: FileText,
};

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#161722" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#10111a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3f4f6" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "rgba(99, 102, 241, 0.5)" }, { weight: 1.2 }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#252738" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1b1c28" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f121d" }],
  },
];

export default function CommunityMapExplorer({
  submissions,
  selectedCountry,
  selectedCategory,
  onUpvote,
  upvotedIds,
  onNavigateToTrack,
  className = "",
}: CommunityMapExplorerProps) {
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Country center coordinates
  const countryCenter = useMemo(() => {
    return getLocationCoordinates(selectedCountry);
  }, [selectedCountry]);

  // Valid geo submissions
  const geoSubmissions = useMemo(() => {
    return submissions.filter(
      (s) => typeof s.lat === "number" && typeof s.lng === "number" && s.lat !== 0 && s.lng !== 0
    );
  }, [submissions]);

  // Google Maps API Key setup
  const mapsKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof window !== "undefined" &&
      ((window as any).__ENV?.VITE_GOOGLE_MAPS_API_KEY ||
        (window as any).VITE_GOOGLE_MAPS_API_KEY ||
        (window as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)) ||
    "AIzaSyDeh5qMcJgn5Rlxs0oYT8PCFKvICz7YoI0";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "nagarvaani-google-maps-script",
    googleMapsApiKey: mapsKey,
  });

  // Fit bounds or pan when country changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: countryCenter.lat,
        lng: countryCenter.lng,
      });
      mapRef.current.setZoom(countryCenter.zoom || 5);
    }
  }, [countryCenter]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div
      id="community-real-map-explorer"
      className={`rounded-[16px] overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-elevated)] transition-all shadow-xs flex flex-col ${
        isFullscreen
          ? "fixed inset-4 sm:inset-8 z-50 shadow-2xl bg-[var(--bg-surface)] border-2 border-[#6366f1]"
          : `h-[460px] sm:h-[520px] ${className}`
      }`}
    >
      {/* Top Map Bar */}
      <div className="px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-dim)] flex items-center justify-between gap-3 text-[12px] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] text-[var(--text-primary)]">
                {selectedCountry} Grievance Map
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#6366f1] font-semibold">
                {geoSubmissions.length} Plotted Issues
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Map / Satellite Toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-elevated)] p-0.5 rounded-[7px] border border-[var(--border-dim)]">
            <button
              type="button"
              onClick={() => setMapType("roadmap")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-[5px] transition-colors cursor-pointer ${
                mapType === "roadmap"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapType("satellite")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-[5px] transition-colors cursor-pointer ${
                mapType === "satellite"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-[8px] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-dim)] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
        {isLoaded && !loadError ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={{ lat: countryCenter.lat, lng: countryCenter.lng }}
            zoom={countryCenter.zoom || 5}
            mapTypeId={mapType}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              gestureHandling: "greedy",
              clickableIcons: false,
              styles: mapType === "roadmap" ? DARK_MAP_STYLES : [],
            }}
          >
            {/* Render all plotted citizen complaints */}
            {geoSubmissions.map((sub) => {
              const catColor = CATEGORY_COLORS[sub.category] || "#6366f1";
              const isSelected = selectedSubmission?.id === sub.id;

              return (
                <MarkerF
                  key={sub.id}
                  position={{ lat: sub.lat, lng: sub.lng }}
                  onClick={() => setSelectedSubmission(sub)}
                  title={`${sub.category.toUpperCase()} — ${sub.district || sub.country}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: isSelected ? 8 : 6,
                    fillColor: catColor,
                    fillOpacity: 0.95,
                    strokeWeight: isSelected ? 3 : 1.5,
                    strokeColor: "#ffffff",
                  }}
                />
              );
            })}

            {/* Selected Complaint Detailed Info Popup */}
            {selectedSubmission && (
              <InfoWindowF
                position={{ lat: selectedSubmission.lat, lng: selectedSubmission.lng }}
                onCloseClick={() => setSelectedSubmission(null)}
              >
                <div className="p-1 max-w-[260px] text-slate-900 font-sans">
                  {/* Category & Urgency badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[selectedSubmission.category] || "#6366f1" }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                        {selectedSubmission.category}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                      Priority U-{selectedSubmission.urgency}
                    </span>
                  </div>

                  {/* Summary Text */}
                  <p className="text-[12px] font-medium text-slate-900 leading-snug line-clamp-3 mb-2">
                    {selectedSubmission.summary_english || selectedSubmission.text}
                  </p>

                  {/* Photo if present */}
                  {selectedSubmission.photo_url && (
                    <div className="mb-2 rounded-[6px] overflow-hidden border border-slate-200">
                      <img
                        src={selectedSubmission.photo_url}
                        alt="Issue evidence"
                        className="w-full h-24 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Location & Tracking ID */}
                  <div className="text-[11px] text-slate-600 mb-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <strong>{selectedSubmission.district || selectedSubmission.country}</strong>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{selectedSubmission.id}</span>
                  </div>

                  {/* Action Buttons: Upvote & Track */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onUpvote(selectedSubmission)}
                      className={`flex-1 py-1 rounded-[6px] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        upvotedIds.has(selectedSubmission.id)
                          ? "bg-[#6366f1] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{selectedSubmission.upvotes || 0} Upvote</span>
                    </button>

                    {onNavigateToTrack && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTrack(selectedSubmission.id)}
                        className="px-2 py-1 rounded-[6px] bg-slate-800 hover:bg-slate-950 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          /* Fallback view if key loading */
          <div className="relative w-full h-full flex items-center justify-center p-6 text-center text-white">
            <div className="space-y-2">
              <Compass className="w-8 h-8 text-[#6366f1] animate-spin mx-auto" />
              <p className="text-[13px] text-slate-300">Initializing Real Interactive GIS Map...</p>
            </div>
          </div>
        )}

        {/* Floating Zoom Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
          <button
            type="button"
            title="Zoom In"
            onClick={() => {
              if (mapRef.current) {
                const cur = mapRef.current.getZoom() || 5;
                mapRef.current.setZoom(cur + 1);
              }
            }}
            className="w-8 h-8 rounded-[8px] bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-dim)] flex items-center justify-center shadow-sm cursor-pointer transition-colors backdrop-blur-xs"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => {
              if (mapRef.current) {
                const cur = mapRef.current.getZoom() || 5;
                mapRef.current.setZoom(cur - 1);
              }
            }}
            className="w-8 h-8 rounded-[8px] bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-dim)] flex items-center justify-center shadow-sm cursor-pointer transition-colors backdrop-blur-xs"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 p-1.5 px-2.5 rounded-[8px] bg-slate-950/85 border border-slate-800 text-white text-[10px] backdrop-blur-xs shadow-md">
          <span className="font-semibold text-slate-400">Legend:</span>
          {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize text-slate-300">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
