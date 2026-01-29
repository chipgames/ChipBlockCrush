import { useState, useEffect } from "react";
import { LanguageService } from "@/services/LanguageService";
import type { SupportedLanguage } from "@/constants/languages";

const translationsCache: Record<string, Record<string, unknown>> = {};

export const useLanguage = () => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const service = new LanguageService();
    return service.getCurrentLanguage();
  });
  const [translations, setTranslations] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        if (translationsCache[language]) {
          setTranslations(translationsCache[language]);
          setIsLoading(false);
          return;
        }
        const module = await import(`../locales/${language}.json`);
        translationsCache[language] = module.default as Record<string, unknown>;
        setTranslations(module.default as Record<string, unknown>);
      } catch (error) {
        try {
          const fallback = await import(`../locales/ko.json`);
          setTranslations(fallback.default as Record<string, unknown>);
        } catch {
          setTranslations({});
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTranslations();
  }, [language]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const e = event as CustomEvent<string>;
      if (
        e.detail &&
        (e.detail === "ko" ||
          e.detail === "en" ||
          e.detail === "ja" ||
          e.detail === "zh")
      ) {
        setLanguageState(e.detail as SupportedLanguage);
      }
    };
    window.addEventListener("languageChanged", handleLanguageChange);
    return () =>
      window.removeEventListener("languageChanged", handleLanguageChange);
  }, []);

  const setLanguage = (lang: string) => {
    const service = new LanguageService();
    service.setLanguage(lang);
    if (lang === "ko" || lang === "en" || lang === "ja" || lang === "zh") {
      setLanguageState(lang as SupportedLanguage);
    }
  };

  const t = (key: string): string => {
    if (isLoading || !translations) return key;
    const keys = key.split(".");
    let value: unknown = translations;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
      if (value === undefined) break;
    }
    return (typeof value === "string" ? value : key) || key;
  };

  return { language, setLanguage, t, isLoading };
};
