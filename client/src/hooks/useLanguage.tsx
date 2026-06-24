import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load default language from localStorage or fallback to 'vi'
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang === 'vi' || savedLang === 'en' || savedLang === 'ko') ? savedLang as Language : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Cache for resolved key paths to optimize CPU performance
  const translationCache = React.useRef<Record<string, Record<string, string>>>({
    vi: {},
    en: {},
    ko: {},
  });

  // Translation helper function with memoization
  const t = React.useCallback((keyPath: string, replacements?: Record<string, string | number>): string => {
    const langCache = translationCache.current[language] || (translationCache.current[language] = {});
    
    let template = langCache[keyPath];
    if (template === undefined) {
      const keys = keyPath.split('.');
      let current: any = translations[language];

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          // Fallback to vi if not found in current language
          let fallback: any = translations['vi'];
          for (const fallbackKey of keys) {
            if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
              fallback = fallback[fallbackKey];
            } else {
              fallback = null;
              break;
            }
          }
          current = fallback || keyPath;
          break;
        }
      }

      template = typeof current === 'string' ? current : keyPath;
      langCache[keyPath] = template;
    }

    if (!replacements) {
      return template;
    }

    // Replace dynamic placeholders if replacements are provided (e.g. {count})
    let result = template;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });

    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
