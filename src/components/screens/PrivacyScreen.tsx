import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import "./PrivacyScreen.css";

interface PrivacyScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

const SECTIONS = [
  ["section1Title", "section1Content"],
  ["section2Title", "section2Content"],
  ["section3Title", "section3Content"],
  ["section4Title", "section4Content"],
  ["section5Title", "section5Content"],
] as const;

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="privacy-screen" role="main" aria-label={t("privacy.title")}>
      <h1 className="privacy-title">{t("privacy.title")}</h1>
      <p className="privacy-updated">{t("privacy.lastUpdated")}</p>
      <p className="privacy-intro">{t("privacy.intro")}</p>
      <div className="privacy-sections">
        {SECTIONS.map(([titleKey, contentKey]) => (
          <section key={titleKey} className="privacy-section">
            <h2 className="privacy-section-title">
              {t(`privacy.${titleKey}`)}
            </h2>
            <p className="privacy-section-content">
              {t(`privacy.${contentKey}`)}
            </p>
          </section>
        ))}
      </div>
      <button
        type="button"
        className="privacy-back"
        onClick={() => onNavigate("menu")}
      >
        {t("game.backToStage")}
      </button>
    </div>
  );
};

export default PrivacyScreen;
