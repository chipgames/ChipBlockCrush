import React, { memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { GameScreen } from "@/types/ui";
import "./Footer.css";

declare const __APP_VERSION__: string;
const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

interface FooterProps {
  onNavigate?: (screen: GameScreen) => void;
}

const Footer: React.FC<FooterProps> = memo(({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <nav className="footer-links">
          {onNavigate ? (
            <button
              type="button"
              className="footer-link footer-link-button"
              onClick={() => onNavigate("privacy")}
            >
              {t("footer.privacy")}
            </button>
          ) : (
            <a href="#privacy" className="footer-link">
              {t("footer.privacy")}
            </a>
          )}
          <a href="#contact" className="footer-link">
            {t("footer.contact")}
          </a>
        </nav>
        <div className="footer-center">
          <LanguageSelector />
        </div>
        <div className="footer-copyright">
          {t("footer.copyright")} | v{APP_VERSION}
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
