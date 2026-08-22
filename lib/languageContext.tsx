'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "./i18n";
import { useTranslation, I18nextProvider } from "react-i18next";
import {
  LanguageCode,
  LanguageOption,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from "./translations";

export type { LanguageCode, LanguageOption };
export { SUPPORTED_LANGUAGES, TRANSLATIONS, useTranslation, i18n };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLangOption: LanguageOption;
  t: (key: string, defaultText?: string) => string;
  i18n: typeof i18n;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t: i18nTranslate } = useTranslation();
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = (localStorage.getItem("nv_language") || i18n.language) as LanguageCode | null;
        if (saved && TRANSLATIONS[saved]) {
          return saved;
        }
      } catch {
        return "en";
      }
    }
    const current = (i18n.language?.split("-")[0] as LanguageCode) || "en";
    return TRANSLATIONS[current] ? current : "en";
  });

  useEffect(() => {
    // Ensure i18next language is synced
    if (i18n.language !== language && TRANSLATIONS[language]) {
      i18n.changeLanguage(language);
    }

    const handleLanguageChanged = (lng: string) => {
      const normalizedLng = (lng.split("-")[0] as LanguageCode) || "en";
      if (TRANSLATIONS[normalizedLng] && normalizedLng !== language) {
        setLanguageState(normalizedLng);
      }
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [language]);

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    i18n.changeLanguage(newLang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nv_language", newLang);
      } catch (e) {
        console.warn("Unable to save language to localStorage", e);
      }
    }
  };

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, defaultText?: string): string => {
    // 1. First priority: i18next library translation
    const translated = i18nTranslate(key);
    if (translated && translated !== key) {
      return translated;
    }

    // 2. Direct active language lookup
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }

    // 3. Fallback to English dictionary
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }

    // 4. Default provided text or key
    return defaultText || key;
  };

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider
        value={{
          language,
          setLanguage,
          currentLangOption,
          t,
          i18n,
        }}
      >
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: "en" as LanguageCode,
      setLanguage: (lng: LanguageCode) => i18n.changeLanguage(lng),
      currentLangOption: SUPPORTED_LANGUAGES[0],
      t: (key: string, defaultText?: string) => {
        return i18n.t(key, { defaultValue: defaultText || key });
      },
      i18n,
    };
  }
  return context;
}
