import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import "./HelpScreen.css";

interface HelpScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

const FAQ_KEYS = [
  ["faq1", "faq1a"],
  ["faq2", "faq2a"],
  ["faq3", "faq3a"],
  ["faq4", "faq4a"],
  ["faq5", "faq5a"],
  ["faq6", "faq6a"],
] as const;

const HelpScreen: React.FC<HelpScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="help-screen" role="main" aria-label={t("help.title")}>
      <h1 className="help-title">{t("help.title")}</h1>
      <p className="help-intro">{t("help.intro")}</p>
      <div className="help-faq">
        {FAQ_KEYS.map(([qKey, aKey]) => (
          <div key={qKey} className="help-faq-item">
            <p className="help-faq-q">{t(`help.${qKey}`)}</p>
            <p className="help-faq-a">{t(`help.${aKey}`)}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="help-back"
        onClick={() => onNavigate("menu")}
      >
        {t("game.backToStage")}
      </button>
    </div>
  );
};

export default HelpScreen;
