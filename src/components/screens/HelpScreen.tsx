import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import "./HelpScreen.css";

interface HelpScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="help-screen">
      <h1 className="help-title">{t("help.title")}</h1>
      <div className="help-faq">
        <p>{t("help.faq1")}</p>
        <p>{t("help.faq2")}</p>
      </div>
      <button
        type="button"
        className="help-back"
        onClick={() => onNavigate("stageSelect")}
      >
        {t("header.playGame")}
      </button>
    </div>
  );
};

export default HelpScreen;
