import { useState, useEffect, useCallback } from "react";
import { storageManager } from "@/utils/storage";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
};

const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute("content", theme === "light" ? "#f5f5f8" : "#1a1a2e");
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = storageManager.get<Theme>(THEME_STORAGE_KEY, {
      fallback: null,
      silent: true,
    });
    if (saved === "light" || saved === "dark") return saved;
    return getSystemTheme();
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      storageManager.set(THEME_STORAGE_KEY, next, { silent: true });
      applyTheme(next);
      return next;
    });
  }, []);

  const setThemeValue = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    storageManager.set(THEME_STORAGE_KEY, newTheme, { silent: true });
    applyTheme(newTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    isLight: theme === "light",
    isDark: theme === "dark",
  };
};
