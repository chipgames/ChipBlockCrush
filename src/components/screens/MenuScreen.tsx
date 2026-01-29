import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import "./MenuScreen.css";

interface MenuScreenProps {
  onNavigate: (screen: GameScreen) => void;
  onStartGame: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onNavigate, onStartGame }) => {
  const { t } = useLanguage();
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
      </nav>
    </div>
  );
};

export default MenuScreen;
