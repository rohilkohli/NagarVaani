import { useJsApiLoader } from "@react-google-maps/api";

declare global {
  interface Window {
    __NV_CONFIG__?: {
      mapsKey?: string;
    };
  }
}

/**
 * Returns the Google Maps API key from runtime window.__NV_CONFIG__ (injected via /config.js)
 * with fallback to Vite / Node build/environment variables.
 */
export function getMapsKey(): string {
  if (typeof window !== "undefined" && window.__NV_CONFIG__?.mapsKey) {
    return window.__NV_CONFIG__.mapsKey.trim();
  }
  const viteEnvKey =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      : undefined;
  const processEnvKey =
    typeof process !== "undefined" && process.env
      ? process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
      : undefined;
  return (viteEnvKey || processEnvKey || "").trim();
}

export function hasMapsKey(): boolean {
  const key = getMapsKey();
  return Boolean(key && key.length > 5);
}

export const GOOGLE_MAPS_SCRIPT_ID = "nagarvaani-google-maps-script";
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = [];

/**
 * Single shared useJsApiLoader hook across all map views in NagarVaani.
 * Guarantees a single script injection with consistent ID and options.
 */
export function useSharedGoogleMapsLoader() {
  const mapsKey = getMapsKey();
  const hasKey = hasMapsKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: hasKey ? mapsKey : "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  return {
    isLoaded: hasKey && isLoaded,
    loadError: hasKey ? loadError : undefined,
    hasMapsKey: hasKey,
    mapsKey,
  };
}

export const URGENCY_COLORS: Record<number, string> = {
  5: "#ef4444", // Critical / Red
  4: "#f97316", // High / Orange
  3: "#eab308", // Medium / Amber
  2: "#3b82f6", // Low / Blue
  1: "#10b981", // Minimal / Green
};

export const CATEGORY_COLORS: Record<string, string> = {
  roads: "#ef4444",
  water: "#38bdf8",
  electricity: "#fbbf24",
  sanitation: "#f97316",
  health: "#ec4899",
  education: "#a855f7",
  other: "#94a3b8",
};

export const DARK_MAP_STYLES = [
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
