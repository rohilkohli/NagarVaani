'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import {
  MapPin,
  Compass,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Maximize2,
  Minimize2,
  Droplets,
  Zap,
  Trash2,
  HeartPulse,
  GraduationCap,
  FileText,
  AlertTriangle,
  Eye,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Submission, ComplaintCategory } from "@/lib/types";
import { getLocationCoordinates, LocationCoordinates, detectLocationFromGPS } from "@/lib/locations";
import { useLanguage } from "@/lib/languageContext";
import { db } from "@/lib/firebase";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { isDemoMode } from "@/lib/appMode";
import { ALL_SEED_SUBMISSIONS } from "@/lib/seedData";
import {
  useSharedGoogleMapsLoader,
  URGENCY_COLORS,
  CATEGORY_COLORS,
  DARK_MAP_STYLES,
} from "@/lib/mapsConfig";

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

export default function RealCitizenMap({
  country,
  state,
  district,
  landmark,
  customCoords,
  onCoordinatesChange,
  onDistrictDetected,
  isLocating: parentIsLocating,
  onDetectLocation,
  showNearbyReports = true,
  className = "",
  height = "220px",
}: RealCitizenMapProps) {
  const { t } = useLanguage();
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showNearbyPins, setShowNearbyPins] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<Submission | null>(null);
  const [nearbySubmissions, setNearbySubmissions] = useState<Submission[]>([]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [userGpsPosition, setUserGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Single shared useJsApiLoader hook across NagarVaani
  const { isLoaded, loadError, hasMapsKey } = useSharedGoogleMapsLoader();

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

  // Pan map when active coordinates change
  useEffect(() => {
    if (mapRef.current && activePosition.lat && activePosition.lng) {
      mapRef.current.panTo({
        lat: activePosition.lat,
        lng: activePosition.lng,
      });
    }
  }, [activePosition]);

  // Load nearby reports (seeded in demo mode, Firestore in live mode)
  useEffect(() => {
    if (isDemoMode()) {
      // Filter seeded submissions with valid coordinates
      const validSeeds: Submission[] = ALL_SEED_SUBMISSIONS.filter(
        (s) =>
          typeof s.lat === "number" &&
          typeof s.lng === "number" &&
          Number.isFinite(s.lat) &&
          Number.isFinite(s.lng) &&
          (s.lat !== 0 || s.lng !== 0)
      );

      // Match country or find nearest seeded reports
      const matched = validSeeds.filter((s) => {
        if (!s.country) return true;
        return s.country.toLowerCase() === country.toLowerCase();
      });

      const list = matched.length > 0 ? matched : validSeeds;
      // Sort by Euclidean distance to activePosition
      const sorted = [...list].sort((a, b) => {
        const distA = Math.hypot(a.lat - activePosition.lat, a.lng - activePosition.lng);
        const distB = Math.hypot(b.lat - activePosition.lat, b.lng - activePosition.lng);
        return distA - distB;
      });

      setNearbySubmissions(sorted.slice(0, 30));
      return;
    }

    let unsubscribe = () => {};
    try {
      const q = query(collection(db, "submissions"), limit(40));
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
            const filtered = list.filter(
              (r) =>
                r.lat &&
                r.lng &&
                Number.isFinite(r.lat) &&
                Number.isFinite(r.lng) &&
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
  }, [country, district, activePosition.lat, activePosition.lng]);

  // Request user GPS position with clear permission handling
  const handleRequestGps = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setPermissionError("Geolocation is not supported by your browser.");
      return;
    }

    setIsGpsLocating(true);
    setPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsGpsLocating(false);
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserGpsPosition(coords);

        if (onCoordinatesChange) {
          onCoordinatesChange(coords);
        }

        if (mapRef.current) {
          mapRef.current.panTo(coords);
          mapRef.current.setZoom(15);
        }

        // Also call parent handler if provided
        if (onDetectLocation) {
          onDetectLocation();
        }

        // Reverse geocode to auto-detect district/locality
        if (onDistrictDetected) {
          setIsReverseGeocoding(true);
          try {
            const detected = await detectLocationFromGPS(latitude, longitude);
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
      (err) => {
        setIsGpsLocating(false);
        if (err.code === 1) {
          setPermissionError("Location permission denied. Please enable location access in your browser or drag the marker to position manually.");
        } else if (err.code === 2) {
          setPermissionError("GPS location unavailable. Please select your position on the map or pick manually.");
        } else if (err.code === 3) {
          setPermissionError("GPS location request timed out. Please try again.");
        } else {
          setPermissionError("Could not retrieve current location. Please select manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onCoordinatesChange, onDetectLocation, onDistrictDetected]);

  // Handle map click to drop/move pin
  const handleMapClick = useCallback(
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

  const locating = isGpsLocating || parentIsLocating;

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
              <span>{hasMapsKey ? t("interactiveGis", "Live Real Map") : "Offline Reference"}</span>
            </span>
            {isReverseGeocoding && (
              <span className="text-[10px] text-[#6366f1] animate-pulse flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Geocoding...</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Action Tools */}
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

      {/* Permission Denied / Error Alert Banner */}
      {permissionError && (
        <div className="px-3 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPermissionError(null)}
            className="text-amber-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real Interactive Map Canvas */}
      <div
        className={`relative w-full ${
          isFullscreen ? "flex-1 min-h-[350px]" : ""
        }`}
        style={{ height: isFullscreen ? "100%" : height }}
      >
        {!hasMapsKey || loadError ? (
          /* Non-Map Fallback: Never a blank card */
          <div className="w-full h-full flex flex-col justify-between p-4 bg-[var(--bg-elevated)] text-center overflow-y-auto">
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-center">
                {loadError ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <MapPin className="w-5 h-5 text-[var(--text-tertiary)]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-[13px] text-[var(--text-primary)]">
                  {loadError ? "Map load error" : "Map unavailable: key missing or blocked"}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  {loadError
                    ? (loadError.message || "Google Maps script could not be loaded. Location coordinates can still be selected manually.")
                    : "Add GOOGLE_MAPS_API_KEY to enable live map tiles. Coordinates and nearby incident reports remain active."}
                </p>
              </div>
            </div>

            {/* Selected Coordinates Chip */}
            <div className="my-2 py-1 px-3 rounded-[6px] bg-[var(--bg-base)] border border-[var(--border-dim)] mx-auto font-mono text-[11px] text-[#6366f1] inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-red-400" />
              <span>
                {activePosition.lat.toFixed(4)}°, {activePosition.lng.toFixed(4)}° ({district || state || country})
              </span>
            </div>

            {/* Nearby Reports Table / List */}
            {nearbySubmissions.length > 0 && (
              <div className="text-left w-full max-w-sm mx-auto bg-[var(--bg-surface)] rounded-[8px] p-2 border border-[var(--border-dim)]">
                <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Nearby Seeded Reports</span>
                  <span>Urgency</span>
                </div>
                <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1">
                  {nearbySubmissions.slice(0, 4).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-[11px] text-[var(--text-primary)]">
                      <span className="truncate pr-2">• {sub.district || sub.country}: {sub.summary_english || sub.text}</span>
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0"
                        style={{
                          backgroundColor: `${URGENCY_COLORS[sub.urgency] || "#ef4444"}22`,
                          color: URGENCY_COLORS[sub.urgency] || "#ef4444",
                        }}
                      >
                        U-{sub.urgency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isLoaded ? (
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
            {/* Primary Incident Draggable Marker (Target complaint position) */}
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

            {/* Jurisdiction radius circle */}
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

            {/* User GPS Position Indicator (Distinct blue dot / accuracy ring) */}
            {userGpsPosition && (
              <>
                <MarkerF
                  position={userGpsPosition}
                  title="Your Current GPS Position"
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: "#3b82f6",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                  }}
                />
                <CircleF
                  center={userGpsPosition}
                  radius={80}
                  options={{
                    fillColor: "#3b82f6",
                    fillOpacity: 0.15,
                    strokeColor: "#3b82f6",
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                  }}
                />
              </>
            )}

            {/* Nearby Submissions Markers Colored By Urgency */}
            {showNearbyPins &&
              nearbySubmissions.map((item) => {
                const urgencyColor = URGENCY_COLORS[item.urgency] || "#ef4444";
                const isSelected = selectedReport?.id === item.id;
                return (
                  <MarkerF
                    key={item.id}
                    position={{ lat: item.lat, lng: item.lng }}
                    onClick={() => setSelectedReport(item)}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: isSelected ? 7 : 5,
                      fillColor: urgencyColor,
                      fillOpacity: 0.95,
                      strokeWeight: isSelected ? 2.5 : 1.5,
                      strokeColor: "#ffffff",
                    }}
                  />
                );
              })}

            {/* InfoWindow for selected nearby report with Category, District, Urgency, Status */}
            {selectedReport && (
              <InfoWindowF
                position={{ lat: selectedReport.lat, lng: selectedReport.lng }}
                onCloseClick={() => setSelectedReport(null)}
              >
                <div className="p-1 max-w-[220px] text-slate-900 font-sans">
                  {/* Category and Urgency badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      {selectedReport.category}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${URGENCY_COLORS[selectedReport.urgency] || "#ef4444"}25`,
                        color: URGENCY_COLORS[selectedReport.urgency] || "#ef4444",
                      }}
                    >
                      Urgency: {selectedReport.urgency}/5
                    </span>
                  </div>

                  {/* Summary / description */}
                  <p className="text-[12px] line-clamp-2 font-medium text-slate-900 leading-snug">
                    {selectedReport.summary_english || selectedReport.text}
                  </p>

                  {/* District & Status */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-1.5">
                    <span className="font-semibold text-slate-700 truncate pr-1">
                      {selectedReport.district || selectedReport.country}
                    </span>
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 capitalize">
                      {selectedReport.status || "classified"}
                    </span>
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <Loader2 className="w-6 h-6 text-[#6366f1] animate-spin" />
          </div>
        )}

        {/* Floating Controls Overlay (Zoom In, Zoom Out, GPS Fly-to) */}
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
          <button
            type="button"
            title="Detect My GPS Location"
            disabled={locating}
            onClick={handleRequestGps}
            className="w-7 h-7 rounded-[6px] bg-[#6366f1]/15 hover:bg-[#6366f1]/30 text-[#6366f1] border border-[#6366f1]/30 flex items-center justify-center shadow-xs cursor-pointer transition-colors backdrop-blur-xs disabled:opacity-50"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          </button>
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

        <button
          type="button"
          onClick={handleRequestGps}
          disabled={locating}
          className="text-[11px] font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-1 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
        >
          {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
          <span>{locating ? t("locatingGps", "Locating...") : t("recenterGps", "Recenter to GPS")}</span>
        </button>
      </div>
    </div>
  );
}
