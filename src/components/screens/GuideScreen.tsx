import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import "./GuideScreen.css";

interface GuideScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

const GuideScreen: React.FC<GuideScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="guide-screen">
      <h1 className="guide-title">{t("guide.title")}</h1>
      <p className="guide-description">{t("guide.description")}</p>
      <ol className="guide-steps">
        <li>{t("guide.step1")}</li>
        <li>{t("guide.step2")}</li>
        <li>{t("guide.step3")}</li>
      </ol>
      <button
        type="button"
        className="guide-back"
        onClick={() => onNavigate("stageSelect")}
      >
        {t("header.playGame")}
      </button>
    </div>
  );
};

export default GuideScreen;
