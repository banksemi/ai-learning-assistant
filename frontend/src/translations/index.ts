import { Language } from '@/types';

// Import all language files
import en from './en';
import ko from './ko';
import ja from './ja';
import zh from './zh';

// Create a translations object with all languages
const translations = {
  en,
  ko,
  ja,
  zh,
};

/**
 * Get a translated string based on the current language
 * @param key The translation key
 * @param language The current language
 * @returns The translated string
 */
export const getTranslation = (key: string, language: Language): string => {
  // Split the key by dots to access nested properties
  const keys = key.split('.');

  // Get the translations for the current language
  let translation = translations[language];

  // Navigate through the nested properties
  for (const k of keys) {
    if (translation && typeof translation === 'object' && k in translation) {
      translation = translation[k];
    } else {
      // If the key doesn't exist, return the key itself as a fallback
      console.warn(`Translation key "${key}" not found for language "${language}"`);
      return key;
    }
  }

  return translation as string;
};

/**
 * Create a React hook to use translations
 */
import { useQuiz } from '@/context/QuizContext';

/**
 * Format a translation string with variables
 * @param text The translation string with placeholders like {variable}
 * @param variables Object containing the variables to replace
 * @returns The formatted string
 */
export const formatTranslation = (text: string, variables?: Record<string, any>): string => {
  if (!variables) return text;

  return text.replace(/{(\w+)}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
};

/**
 * React hook to use translations with the current language from QuizContext
 * @returns Object with translation functions
 */
export const useTranslation = () => {
  const { language } = useQuiz();

  /**
   * Get a translated string for the current language
   * @param key The translation key
   * @param variables Optional variables to format the translation
   * @returns The translated string
   */
  const t = (key: string, variables?: Record<string, any>): string => {
    const translation = getTranslation(key, language);
    return variables ? formatTranslation(translation, variables) : translation;
  };

  return {
    t,
    language,
  };
};

export default translations;
