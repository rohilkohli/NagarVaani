import { useEffect, useState } from "react";

type AccessibilityPreferences = {
  acknowledged: boolean;
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

const STORAGE_KEY = "nv_accessibility_preferences";

const defaultPreferences: AccessibilityPreferences = {
  acknowledged: false,
  largeText: false,
  highContrast: false,
  reduceMotion: false,
};

function readPreferences(): AccessibilityPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<AccessibilityPreferences> | null;
    return {
      ...defaultPreferences,
      ...(saved || {}),
      acknowledged: Boolean(saved?.acknowledged),
    };
  } catch {
    return defaultPreferences;
  }
}

export default function AccessibilityPrompt() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences | null>(null);

  useEffect(() => {
    setPreferences(readPreferences());
  }, []);

  useEffect(() => {
    if (!preferences) return;

    const root = document.documentElement;
    root.classList.toggle("accessibility-large-text", preferences.largeText);
    root.classList.toggle("accessibility-high-contrast", preferences.highContrast);
    root.classList.toggle("accessibility-reduce-motion", preferences.reduceMotion);
  }, [preferences]);

  if (!preferences || preferences.acknowledged) return null;

  const updatePreference = (key: keyof Omit<AccessibilityPreferences, "acknowledged">) => {
    setPreferences((current) => current ? { ...current, [key]: !current[key] } : current);
  };

  const savePreferences = (next: AccessibilityPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("Unable to save accessibility preferences", error);
    }
    setPreferences(next);
  };

  return (
    <div className="accessibility-prompt-backdrop" role="presentation">
      <section
        className="accessibility-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-prompt-title"
        aria-describedby="accessibility-prompt-description"
      >
        <p className="accessibility-prompt-eyebrow">Welcome to NagarVaani</p>
        <h1 id="accessibility-prompt-title">Would you like accessibility support?</h1>
        <p id="accessibility-prompt-description">
          Choose any options that make reporting and tracking civic issues easier.
          Your choice is saved only on this device.
        </p>

        <div className="accessibility-prompt-options">
          {([
            ["largeText", "Larger text", "Increase text size and spacing across the app."],
            ["highContrast", "Higher contrast", "Make borders, controls, and text easier to distinguish."],
            ["reduceMotion", "Reduce motion", "Turn off animations and smooth transitions."],
          ] as const).map(([key, label, description]) => (
            <label className="accessibility-prompt-option" key={key}>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => updatePreference(key)}
              />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="accessibility-prompt-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => savePreferences({ ...preferences, acknowledged: true })}
          >
            Continue without changes
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => savePreferences({ ...preferences, acknowledged: true })}
          >
            Save accessibility choices
          </button>
        </div>
      </section>
    </div>
  );
}
