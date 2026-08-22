'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import {
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Maximize2,
  Minimize2,
  Info,
  Droplets,
  Zap,
  Trash2,
  HeartPulse,
  GraduationCap,
  FileText,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Navigation,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { getLocationCoordinates, LocationCoordinates, detectLocationFromGPS } from "@/lib/locations";
import { useLanguage } from "@/lib/languageContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, onSnapshot } from "firebase/firestore";

interface RealCitizenMapProps {
  country: string;
  state?: string;
  district?: string;
  landmark?: string;
  customCoords?: { lat: number; lng: number } | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  onDistrictDetected?: (detected: { country: string; state: string; district: string }) => void;
  isLocating?: boolean;
  onDetectLocation?: () => void;
  showNearbyReports?: boolean;
  className?: string;
  height?: string;
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

// Clean styling for dark & light mode
const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#171822" }] },
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
    stylers: [{ color: "rgba(99, 102, 241, 0.4)" }, { weight: 1.2 }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "rgba(255, 255, 255, 0.15)" }, { weight: 0.8 }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }],
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
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#373b54" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f121d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
];

export default function RealCitizenMap({
  country,
  state,
  district,
  landmark,
  customCoords,
  onCoordinatesChange,
  onDistrictDetected,
  isLocating,
  onDetectLocation,
  showNearbyReports = true,
  className = "",
  height = "220px",
}: RealCitizenMapProps) {
  const { t } = useLanguage();
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">("roadmap");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showNearbyPins, setShowNearbyPins] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<Submission | null>(null);
  const [nearbySubmissions, setNearbySubmissions] = useState<Submission[]>([]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Derived current coordinates
  const locationInfo: LocationCoordinates = useMemo(() => {
    if (customCoords && customCoords.lat && customCoords.lng) {
      return {
        lat: customCoords.lat,
        lng: customCoords.lng,
        zoom: 15,
        label: `${district || state || country} (Pinpoint)`,
        isEstimated: false,
      };
    }
    return getLocationCoordinates(country, state, district || landmark);
  }, [country, state, district, landmark, customCoords]);

  const activePosition = useMemo(() => {
    return {
      lat: customCoords?.lat ?? locationInfo.lat,
      lng: customCoords?.lng ?? locationInfo.lng,
    };
  }, [customCoords, locationInfo]);

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

  // Pan map when active coordinates change
  useEffect(() => {
    if (mapRef.current && activePosition.lat && activePosition.lng) {
      mapRef.current.panTo({
        lat: activePosition.lat,
        lng: activePosition.lng,
      });
    }
  }, [activePosition]);

  // Fetch nearby reports from Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, "submissions"), limit(30));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Submission[] = snapshot.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                text: d.text || "",
                language: d.language || "English",
                category: (d.category as ComplaintCategory) || "roads",
                urgency: (d.urgency as 1 | 2 | 3 | 4 | 5) || 3,
                summary_english: d.summary_english || d.text || "",
                district: d.district || "",
                state: d.state || "",
                country: d.country || "India",
                lat: d.lat || 0,
                lng: d.lng || 0,
                photo_url: d.photo_url || undefined,
                created_at: d.created_at ? new Date(d.created_at) : new Date(),
                status: d.status || "classified",
              };
            });
            // Filter reports close to active region or matching country
            const filtered = list.filter(
              (r) =>
                r.lat &&
                r.lng &&
                r.lat !== 0 &&
                (r.country.toLowerCase() === country.toLowerCase() ||
                  (district && r.district.toLowerCase() === district.toLowerCase()))
            );
            setNearbySubmissions(filtered);
          }
        },
        () => {}
      );
    } catch {
      // Fallback gracefully
    }
    return () => unsubscribe();
  }, [country, district]);

  // Handle map click to drop/move pin
  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();

      if (onCoordinatesChange) {
        onCoordinatesChange({ lat: newLat, lng: newLng });
      }

      // Reverse geocode to auto-detect district/locality
      if (onDistrictDetected) {
        setIsReverseGeocoding(true);
        try {
          const detected = await detectLocationFromGPS(newLat, newLng);
          if (detected) {
            onDistrictDetected({
              country: detected.country,
              state: detected.state,
              district: detected.district,
            });
          }
        } catch {
          // Ignored
        } finally {
          setIsReverseGeocoding(false);
        }
      }
    },
    [onCoordinatesChange, onDistrictDetected]
  );

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();

      if (onCoordinatesChange) {
        onCoordinatesChange({ lat: newLat, lng: newLng });
      }

      if (onDistrictDetected) {
        setIsReverseGeocoding(true);
        try {
          const detected = await detectLocationFromGPS(newLat, newLng);
          if (detected) {
            onDistrictDetected({
              country: detected.country,
              state: detected.state,
              district: detected.district,
            });
          }
        } catch {
          // Ignored
        } finally {
          setIsReverseGeocoding(false);
        }
      }
    },
    [onCoordinatesChange, onDistrictDetected]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const googleMapsWebUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${activePosition.lat},${activePosition.lng}`;
  }, [activePosition]);

  return (
    <div
      id="citizen-real-map-container"
      className={`rounded-[14px] overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-elevated)] transition-all shadow-2xs ${
        isFullscreen
          ? "fixed inset-4 sm:inset-10 z-50 shadow-2xl flex flex-col bg-[var(--bg-surface)] border-2 border-[#6366f1]"
          : `relative flex flex-col ${className}`
      }`}
    >
      {/* Top Interactive Toolbar */}
      <div className="px-3.5 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-dim)] flex items-center justify-between gap-2 text-[12px] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-[var(--text-primary)] truncate">
              {district ? district : (state || country)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t("interactiveGis", "Live Real Map")}</span>
            </span>
            {isReverseGeocoding && (
              <span className="text-[10px] text-[#6366f1] animate-pulse flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Geocoding...</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Action Tools: Map Type Toggle, Nearby Toggle, Fullscreen */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Map / Satellite Toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-elevated)] p-0.5 rounded-[7px] border border-[var(--border-dim)]">
            <button
              type="button"
              onClick={() => setMapType("roadmap")}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-[5px] transition-colors cursor-pointer ${
                mapType === "roadmap"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMapType("satellite")}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-[5px] transition-colors cursor-pointer ${
                mapType === "satellite"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Toggle nearby community reports */}
          {showNearbyReports && (
            <button
              type="button"
              title={showNearbyPins ? "Hide community reports" : "Show community reports"}
              onClick={() => setShowNearbyPins(!showNearbyPins)}
              className={`px-2 py-1 rounded-[6px] border text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showNearbyPins
                  ? "bg-[#6366f1]/15 border-[#6366f1]/30 text-[#6366f1]"
                  : "bg-[var(--bg-surface)] border-[var(--border-dim)] text-[var(--text-secondary)]"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Nearby ({nearbySubmissions.length})</span>
            </button>
          )}

          {/* Fullscreen Expand Toggle */}
          <button
            type="button"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Map"}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-7 h-7 rounded-[6px] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-dim)] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real Interactive Map Canvas */}
      <div
        className={`relative w-full ${
          isFullscreen ? "flex-1 min-h-[350px]" : ""
        }`}
        style={{ height: isFullscreen ? "100%" : height }}
      >
        {isLoaded && !loadError ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={activePosition}
            zoom={customCoords ? 15 : locationInfo.zoom}
            mapTypeId={mapType}
            onClick={handleMapClick}
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
            {/* Primary Incident Draggable Marker */}
            <MarkerF
              position={activePosition}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              animation={google.maps.Animation.DROP}
              title="Click or drag to place exact complaint location"
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: "#ef4444",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
              }}
            />

            {/* Jurisdiction circle radius around target marker */}
            <CircleF
              center={activePosition}
              radius={350}
              options={{
                fillColor: "#6366f1",
                fillOpacity: 0.12,
                strokeColor: "#6366f1",
                strokeOpacity: 0.6,
                strokeWeight: 1.5,
              }}
            />

            {/* Nearby Submissions Markers */}
            {showNearbyPins &&
              nearbySubmissions.map((item) => {
                const catColor = CATEGORY_COLORS[item.category] || "#6366f1";
                return (
                  <MarkerF
                    key={item.id}
                    position={{ lat: item.lat, lng: item.lng }}
                    onClick={() => setSelectedReport(item)}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 5,
                      fillColor: catColor,
                      fillOpacity: 0.9,
                      strokeWeight: 1.5,
                      strokeColor: "#ffffff",
                    }}
                  />
                );
              })}

            {/* InfoWindow for selected nearby report */}
            {selectedReport && (
              <InfoWindowF
                position={{ lat: selectedReport.lat, lng: selectedReport.lng }}
                onCloseClick={() => setSelectedReport(null)}
              >
                <div className="p-1 max-w-[210px] text-slate-900 font-sans">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[selectedReport.category] || "#6366f1" }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {selectedReport.category}
                    </span>
                    <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                      U-{selectedReport.urgency}
                    </span>
                  </div>
                  <p className="text-[12px] line-clamp-2 font-medium text-slate-900 leading-snug">
                    {selectedReport.summary_english || selectedReport.text}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-1">
                    <span>{selectedReport.district || selectedReport.country}</span>
                    <span className="font-mono">{selectedReport.id}</span>
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          /* High-Precision Interactive Leaflet/Slippy Fallback if Google Maps API Key is Loading or Offline */
          <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
                backgroundSize: "28px 28px, 56px 56px, 56px 56px",
              }}
            />

            {/* Simulated Live Geographic Contours */}
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50%" cy="50%" r="70" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="50%" cy="50%" r="130" fill="none" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6366f1" strokeWidth="0.6" strokeOpacity="0.4" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#6366f1" strokeWidth="0.6" strokeOpacity="0.4" />
            </svg>

            {/* Center Geographic Pin */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full bg-red-500/25 animate-ping" />
                <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
              </div>
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-[11px] font-semibold text-white tracking-tight shadow-md">
                {district || state || country}
              </div>
            </div>

            {/* Click to reposition notice */}
            <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-[6px] bg-slate-950/80 border border-slate-700/60 backdrop-blur-xs text-white text-[11px] font-mono">
              <span>
                {activePosition.lat >= 0 ? `${activePosition.lat.toFixed(4)}° N` : `${Math.abs(activePosition.lat).toFixed(4)}° S`},{" "}
                {activePosition.lng >= 0 ? `${activePosition.lng.toFixed(4)}° E` : `${Math.abs(activePosition.lng).toFixed(4)}° W`}
              </span>
            </div>
          </div>
        )}

        {/* Floating Controls Overlay (Zoom In, Zoom Out, Recenter to GPS) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
          <button
            type="button"
            title="Zoom In"
            onClick={() => {
              if (mapRef.current) {
                const cur = mapRef.current.getZoom() || 14;
                mapRef.current.setZoom(cur + 1);
              }
            }}
            className="w-7 h-7 rounded-[6px] bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-dim)] flex items-center justify-center shadow-xs cursor-pointer transition-colors backdrop-blur-xs"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => {
              if (mapRef.current) {
                const cur = mapRef.current.getZoom() || 14;
                mapRef.current.setZoom(cur - 1);
              }
            }}
            className="w-7 h-7 rounded-[6px] bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-dim)] flex items-center justify-center shadow-xs cursor-pointer transition-colors backdrop-blur-xs"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {onDetectLocation && (
            <button
              type="button"
              title="Fly to My GPS Location"
              disabled={isLocating}
              onClick={onDetectLocation}
              className="w-7 h-7 rounded-[6px] bg-[#6366f1]/15 hover:bg-[#6366f1]/30 text-[#6366f1] border border-[#6366f1]/30 flex items-center justify-center shadow-xs cursor-pointer transition-colors backdrop-blur-xs disabled:opacity-50"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Interactive Instruction Pill (Bottom Left) */}
        <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
          <div className="px-2 py-0.5 rounded-[6px] bg-slate-950/80 border border-slate-800 text-slate-300 text-[10px] font-medium backdrop-blur-xs shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Click or drag pin to position</span>
          </div>

          <a
            href={googleMapsWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-1.5 py-0.5 rounded-[6px] bg-black/60 hover:bg-black/80 text-white text-[10px] font-medium flex items-center gap-1 backdrop-blur-xs transition-colors shadow-sm"
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3.5 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-dim)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] text-[var(--text-secondary)] shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-[var(--text-primary)]">Pinpoint:</span>
          <span className="font-mono text-[10px] text-[#6366f1]">
            {activePosition.lat.toFixed(5)}, {activePosition.lng.toFixed(5)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            ({district ? `${district}, ` : ""}{state ? `${state}, ` : ""}{country})
          </span>
        </div>

        {onDetectLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isLocating}
            className="text-[11px] font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-1 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
          >
            <Crosshair className="w-3 h-3" />
            <span>{isLocating ? t("locatingGps", "Locating...") : t("recenterGps", "Recenter to GPS")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
