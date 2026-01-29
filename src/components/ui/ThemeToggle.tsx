import React, { memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import "./ThemeToggle.css";

const ThemeToggle: React.FC = memo(() => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={isLight ? t("header.darkMode") : t("header.lightMode")}
      aria-label={isLight ? t("header.darkMode") : t("header.lightMode")}
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
});

ThemeToggle.displayName = "ThemeToggle";
export default ThemeToggle;
