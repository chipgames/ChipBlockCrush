import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import "./AboutScreen.css";

interface AboutScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="about-screen">
      <h1 className="about-title">{t("about.title")}</h1>
      <p className="about-description">{t("about.description")}</p>
      <h2 className="about-section-title">{t("about.featuresTitle")}</h2>
      <ul className="about-features">
        <li>{t("about.features1")}</li>
        <li>{t("about.features2")}</li>
        <li>{t("about.features3")}</li>
      </ul>
      <p className="about-credits">{t("about.credits")}</p>
      <p className="about-contact">{t("about.contactText")}</p>
      <button
        type="button"
        className="about-back"
        onClick={() => onNavigate("menu")}
      >
        {t("header.playGame")}
      </button>
    </div>
  );
};

export default AboutScreen;
