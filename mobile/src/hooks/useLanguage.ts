import { useAppDispatch, useAppSelector } from '../app/store';
import { setLanguage as setLanguageAction } from '../features/profile/languageSlice';
import { translations, Language } from '../locales';

export const useLanguage = () => {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.language.language);

  const setLanguage = (lang: Language) => {
    dispatch(setLanguageAction(lang));
  };

  const t = (keyPath: string, replacements?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to vi
        let fallback: any = translations['vi'];
        for (const fallbackKey of keys) {
          if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
            fallback = fallback[fallbackKey];
          } else {
            fallback = null;
            break;
          }
        }
        return fallback || keyPath;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let result = current;
    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
    }

    return result;
  };

  return {
    language,
    setLanguage,
    t,
  };
};
