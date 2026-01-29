import React, { memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "@/constants/languages";

const LanguageSelector: React.FC = memo(() => {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      className="language-selector"
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      aria-label="언어 선택"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_NAMES[lang]}
        </option>
      ))}
    </select>
  );
});

LanguageSelector.displayName = "LanguageSelector";
export default LanguageSelector;
