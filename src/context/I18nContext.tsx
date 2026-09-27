import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageCode } from '../types';
import { LANGUAGES, TRANSLATIONS, LanguageOption } from '../services/i18n';

const LANGUAGE_STORAGE_KEY = 'baghewala_language_v1';

export type TranslationParams = Record<string, string | number>;

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallbackOrParams?: string | TranslationParams, maybeParams?: TranslationParams) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
      if (stored && ['en', 'hi', 'raj', 'gu', 'pa', 'mr'].includes(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
      if (stored && ['en', 'hi', 'raj', 'gu', 'pa', 'mr'].includes(stored) && stored !== language) {
        setLanguageState(stored);
      }
    } catch (e) {
      console.error('Failed to load language preference:', e);
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  }, []);

  const t = useCallback(
    (key: string, fallbackOrParams?: string | TranslationParams, maybeParams?: TranslationParams): string => {
      let fallback: string | undefined;
      let params: TranslationParams | undefined;

      if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
        params = fallbackOrParams;
        fallback = undefined;
      } else {
        fallback = fallbackOrParams;
        params = maybeParams;
      }

      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      let text = dict && dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined ? TRANSLATIONS.en[key] : (fallback !== undefined ? fallback : key));

      // Parameter interpolation e.g. {load}, {count}, {name}
      if (params && typeof text === 'string') {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return text;
    },
    [language]
  );

  const currentLanguageOption = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
