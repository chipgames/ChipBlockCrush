import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { GameScreen } from "@/types/ui";
import "./MenuScreen.css";

interface MenuScreenProps {
  onNavigate: (screen: GameScreen) => void;
  onStartGame: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onNavigate, onStartGame }) => {
  const { t } = useLanguage();
  const { canInstall, isIOS, isStandalone, promptInstall } = usePWAInstall();
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [hintType, setHintType] = useState<"ios" | "fallback" | null>(null);

  const showDownload = !isStandalone;
  const handleDownload = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setHintType("ios");
      setShowInstallHint(true);
    } else {
      setHintType("fallback");
      setShowInstallHint(true);
    }
  };

  return (
    <div className="menu-screen">
      <div className="menu-logo-wrap">
        <img
          src={`${import.meta.env.BASE_URL}ChipGames_Logo.png`}
          alt={t("header.logo")}
          className="menu-logo"
        />
      </div>
      <h1 className="menu-title">{t("header.gameTitle")}</h1>
      <p className="menu-desc">{t("menu.subtitle")}</p>
      <button type="button" className="menu-play-btn" onClick={onStartGame}>
        {t("header.playGame")}
      </button>
      <nav className="menu-links">
        <button
          type="button"
          className="menu-link"
          onClick={() => onNavigate("guide")}
        >
          {t("header.guide")}
        </button>
        <button
          type="button"
          className="menu-link"
          onClick={() => onNavigate("help")}
        >
          {t("header.help")}
        </button>
        <button
          type="button"
          className="menu-link"
          onClick={() => onNavigate("about")}
        >
          {t("header.about")}
        </button>
        {showDownload && (
          <button
            type="button"
            className="menu-link menu-link-download"
            onClick={handleDownload}
          >
            {t("header.download")}
          </button>
        )}
      </nav>
      {showInstallHint && hintType && (
        <div
          className="menu-ios-install-overlay"
          onClick={() => {
            setShowInstallHint(false);
            setHintType(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={
            hintType === "ios"
              ? t("menu.installInstructionsIOS")
              : t("menu.installInstructionsFallback")
          }
        >
          <div
            className="menu-ios-install-box"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="menu-ios-install-text">
              {hintType === "ios"
                ? t("menu.installInstructionsIOS")
                : t("menu.installInstructionsFallback")}
            </p>
            <button
              type="button"
              className="menu-ios-install-close"
              onClick={() => {
                setShowInstallHint(false);
                setHintType(null);
              }}
            >
              {t("menu.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuScreen;
