import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { TRANSLATIONS } from './translations';

// Format dictionary as standard i18next resources
const resources = Object.entries(TRANSLATIONS).reduce((acc, [langCode, translationMap]) => {
  acc[langCode] = {
    translation: translationMap,
  };
  return acc;
}, {} as Record<string, { translation: Record<string, string> }>);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta', 'mr', 'bn', 'te', 'pt', 'ru', 'zh', 'es', 'fr', 'ar'],
    interpolation: {
      escapeValue: false, // React already escapes values safely
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'nv_language',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
