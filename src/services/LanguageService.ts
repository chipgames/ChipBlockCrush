import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "@/constants/languages";
import { logger } from "@/utils/logger";

const STORAGE_KEY = "language";

export class LanguageService {
  public detectBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language.split("-")[0];
    if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
      return browserLang as SupportedLanguage;
    }
    return DEFAULT_LANGUAGE;
  }

  public getStoredLanguage(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      logger.error("Failed to get stored language", { error });
      return null;
    }
  }

  public setLanguage(lang: string): void {
    if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        window.dispatchEvent(
          new CustomEvent("languageChanged", { detail: lang }),
        );
        logger.debug("Language changed", { language: lang });
      } catch (error) {
        logger.error("Failed to set language", { error, language: lang });
      }
    }
  }

  public getCurrentLanguage(): SupportedLanguage {
    const stored = this.getStoredLanguage();
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
    return this.detectBrowserLanguage();
  }
}
