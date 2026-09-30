'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  MapPin,
  Compass,
  ThumbsUp,
  ExternalLink,
  ArrowRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Submission } from "@/lib/types";
import { getLocationCoordinates } from "@/lib/locations";
import {
  useSharedGoogleMapsLoader,
  URGENCY_COLORS,
  CATEGORY_COLORS,
  DARK_MAP_STYLES,
} from "@/lib/mapsConfig";

interface CommunityMapExplorerProps {
  submissions: Submission[];
  selectedCountry: string;
  selectedCategory: string;
  onUpvote: (submission: Submission) => void;
  upvotedIds: Set<string>;
  onNavigateToTrack?: (trackingId: string) => void;
  className?: string;
}

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

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

  // Valid geo submissions with finite lat/lng
  const geoSubmissions = useMemo(() => {
    return submissions.filter(
      (s) =>
        typeof s.lat === "number" &&
        typeof s.lng === "number" &&
        Number.isFinite(s.lat) &&
        Number.isFinite(s.lng) &&
        (s.lat !== 0 || s.lng !== 0) &&
        (selectedCategory === "all" || s.category?.toLowerCase() === selectedCategory.toLowerCase())
    );
  }, [submissions, selectedCategory]);

  // Top districts aggregation for fallback and stats
  const topDistricts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of geoSubmissions) {
      const d = sub.district || sub.country || "General";
      counts[d] = (counts[d] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [geoSubmissions]);

  // Single shared useJsApiLoader hook across NagarVaani
  const { isLoaded, loadError, hasMapsKey } = useSharedGoogleMapsLoader();

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

      {/* Map Canvas / Non-Map Fallback */}
      <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
        {!hasMapsKey || loadError ? (
          /* Non-Map Fallback: Table of top districts and plotted issues */
          <div className="w-full h-full flex flex-col justify-between p-6 text-center text-[var(--text-secondary)] overflow-y-auto">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-center">
                {loadError ? (
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                ) : (
                  <MapPin className="w-6 h-6 text-[var(--text-tertiary)]" />
                )}
              </div>
              <h4 className="text-[16px] font-semibold text-[var(--text-primary)]">
                {loadError ? "Map load error" : "Map unavailable: key missing or blocked"}
              </h4>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                {loadError
                  ? (loadError.message || "Google Maps JS API failed to load.")
                  : "Live map tiles require GOOGLE_MAPS_API_KEY. Community grievance records for this region remain listed below."}
              </p>
            </div>

            {/* Top Districts Summary */}
            {topDistricts.length > 0 && (
              <div className="max-w-md w-full mx-auto my-3 bg-[var(--bg-surface)]/80 rounded-[10px] p-3 border border-[var(--border-dim)] text-left">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Top Districts in {selectedCountry}</span>
                  <span>Open Issues</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {topDistricts.map(([dist, count]) => (
                    <div key={dist} className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-dim)] flex items-center justify-between text-[11px] text-[var(--text-primary)]">
                      <span className="truncate mr-1">• {dist}</span>
                      <span className="font-mono text-[10px] px-1 rounded bg-[#6366f1]/20 text-[#6366f1] font-bold">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plotted Issues Table / List */}
            <div className="max-w-xl w-full mx-auto text-left bg-[var(--bg-surface)] rounded-[10px] p-3 border border-[var(--border-dim)]">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Recent Grievances</span>
                <span>Urgency</span>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {geoSubmissions.slice(0, 5).map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className="p-1.5 rounded hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-between text-[12px] cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-[var(--text-primary)] capitalize">
                        {sub.category}
                      </span>{" "}
                      <span className="text-[var(--text-tertiary)]">({sub.district || sub.country})</span>:{" "}
                      <span className="text-[var(--text-secondary)] truncate">
                        {sub.summary_english || sub.text}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: `${URGENCY_COLORS[sub.urgency] || "#ef4444"}20`,
                        color: URGENCY_COLORS[sub.urgency] || "#ef4444",
                      }}
                    >
                      U-{sub.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[var(--text-tertiary)] pt-2">
              Viewing {geoSubmissions.length} complaints across {selectedCountry}
            </div>
          </div>
        ) : isLoaded ? (
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
            {/* Render all plotted citizen complaints colored by urgency */}
            {geoSubmissions.map((sub) => {
              const urgencyColor = URGENCY_COLORS[sub.urgency] || "#ef4444";
              const isSelected = selectedSubmission?.id === sub.id;

              return (
                <MarkerF
                  key={sub.id}
                  position={{ lat: sub.lat, lng: sub.lng }}
                  onClick={() => setSelectedSubmission(sub)}
                  title={`${sub.category.toUpperCase()} (U-${sub.urgency}) — ${sub.district || sub.country}`}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: isSelected ? 8 : 6,
                    fillColor: urgencyColor,
                    fillOpacity: 0.95,
                    strokeWeight: isSelected ? 3 : 1.5,
                    strokeColor: "#ffffff",
                  }}
                />
              );
            })}

            {/* Selected Complaint Detailed Info Popup with Category, District, Urgency, Status */}
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
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${URGENCY_COLORS[selectedSubmission.urgency] || "#ef4444"}25`,
                        color: URGENCY_COLORS[selectedSubmission.urgency] || "#ef4444",
                      }}
                    >
                      Urgency: {selectedSubmission.urgency}/5
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

                  {/* Location & Status */}
                  <div className="text-[11px] text-slate-600 mb-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <strong>{selectedSubmission.district || selectedSubmission.country}</strong>
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 capitalize">
                      {selectedSubmission.status || "classified"}
                    </span>
                  </div>

                  {/* Action Buttons: Upvote & Track */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onUpvote(selectedSubmission)}
                      className={`flex-1 py-1 rounded-[6px] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        upvotedIds.has(selectedSubmission.id)
                          ? "bg-[#6366f1] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{upvotedIds.has(selectedSubmission.id) ? "Upvoted" : "Upvote"}</span>
                    </button>

                    {onNavigateToTrack && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTrack(selectedSubmission.id)}
                        className="py-1 px-2.5 rounded-[6px] bg-indigo-50 hover:bg-indigo-100 text-[#6366f1] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : null}
      </div>
    </div>
  );
}
