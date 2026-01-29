import React, { useState, useEffect, memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { GameScreen } from "@/types/ui";
import { soundManager } from "@/utils/SoundManager";
import { storageManager } from "@/utils/storage";
import "./Header.css";

interface HeaderProps {
  onNavigate?: (screen: GameScreen) => void;
  onStartGame?: () => void;
  currentScreen?: GameScreen;
}

const Header: React.FC<HeaderProps> = memo(({ onNavigate, onStartGame }) => {
  const { t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () =>
      storageManager.get<boolean>("soundEnabled", {
        fallback: true,
        silent: true,
      }) ?? true,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    storageManager.set("soundEnabled", soundEnabled, { silent: true });
  }, [soundEnabled]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleMenuClick = (screen: GameScreen) => {
    onNavigate?.(screen);
    setIsMobileMenuOpen(false);
  };

  const toggleSound = () => {
    setSoundEnabled((v) => !v);
    if (soundEnabled) soundManager.playClick();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div
          className="header-logo"
          onClick={() => handleMenuClick("menu")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleMenuClick("menu")}
        >
          <img
            src={`${import.meta.env.BASE_URL}ChipGames_Logo.png`}
            alt={t("header.logo")}
            className="header-logo-img"
          />
          <span className="header-game-title">{t("header.gameTitle")}</span>
        </div>
        {isMobileMenuOpen && (
          <div
            className="header-nav-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden
          />
        )}
        <nav className={`header-nav ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          <button
            type="button"
            className="header-nav-button"
            onClick={() =>
              onStartGame ? onStartGame() : handleMenuClick("menu")
            }
          >
            {t("header.playGame")}
          </button>
          <button
            type="button"
            className="header-nav-button"
            onClick={() => handleMenuClick("guide")}
          >
            {t("header.guide")}
          </button>
          <button
            type="button"
            className="header-nav-button"
            onClick={() => handleMenuClick("help")}
          >
            {t("header.help")}
          </button>
          <button
            type="button"
            className="header-nav-button"
            onClick={() => handleMenuClick("about")}
          >
            {t("header.about")}
          </button>
        </nav>
        <div className="header-right">
          <ThemeToggle />
          <button
            type="button"
            className="header-sound-button"
            onClick={toggleSound}
            title={soundEnabled ? t("header.soundOff") : t("header.soundOn")}
            aria-label={
              soundEnabled ? t("header.soundOff") : t("header.soundOn")
            }
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <LanguageSelector />
          <button
            type="button"
            className="header-hamburger"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="메뉴"
            aria-expanded={isMobileMenuOpen}
          >
            <span
              className={`hamburger-line ${isMobileMenuOpen ? "active" : ""}`}
            />
            <span
              className={`hamburger-line ${isMobileMenuOpen ? "active" : ""}`}
            />
            <span
              className={`hamburger-line ${isMobileMenuOpen ? "active" : ""}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";
export default Header;
