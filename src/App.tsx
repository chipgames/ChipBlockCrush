import React, { useState, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import MenuScreen from "@/components/screens/MenuScreen";
import GuideScreen from "@/components/screens/GuideScreen";
import HelpScreen from "@/components/screens/HelpScreen";
import AboutScreen from "@/components/screens/AboutScreen";
import PrivacyScreen from "@/components/screens/PrivacyScreen";
import GameScreen from "@/components/game/GameScreen";
import ContactModal from "@/components/ui/ContactModal";
import SEOHead from "@/components/seo/SEOHead";
import { GameScreen as GameScreenType } from "@/types/ui";
import { useTheme } from "@/hooks/useTheme";
import { registerServiceWorker } from "@/utils/serviceWorker";
import { storageManager } from "@/utils/storage";
import { useLanguage } from "@/hooks/useLanguage";
import "@/styles/App.css";
import "@/styles/themes.css";
import "@/styles/OrientationLockButton.css";

const ORIENTATION_LOCK_KEY = "chipBlockCrush_orientationLocked";

/** Screen Orientation API (lock/unlock) - 표준 타입에 lock이 없을 수 있어 단언용 */
interface ScreenWithOrientationLock {
  orientation?: {
    lock: (t: string) => Promise<void>;
    unlock: () => Promise<void>;
    type: string;
  };
}

const App: React.FC = () => {
  useTheme();
  const { t } = useLanguage();
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const [currentScreen, setCurrentScreen] = useState<GameScreenType>("menu");
  const [currentStage, setCurrentStage] = useState<number | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      window.innerHeight <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });

  const [isOrientationLocked, setIsOrientationLocked] = useState<boolean>(
    () =>
      (typeof window !== "undefined" &&
        storageManager.get<string>(ORIENTATION_LOCK_KEY, {
          fallback: "false",
        }) === "true") ??
      false,
  );

  /** 모바일 전용: 메뉴·푸터 숨김 (화면 확대용) */
  const [menuFooterHidden, setMenuFooterHidden] = useState(false);

  /** 문의하기 모달 표시 여부 */
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleNavigate = (screen: GameScreenType) => {
    setCurrentScreen(screen);
  };

  const handleStartGame = () => {
    setCurrentStage(1);
    setCurrentScreen("game");
  };

  const handleBackFromGame = () => {
    setCurrentScreen("menu");
    setCurrentStage(null);
  };

  const toggleOrientationLock = async () => {
    const scr = screen as unknown as ScreenWithOrientationLock;
    if (typeof window === "undefined" || !scr.orientation) {
      alert(t("header.orientationUnlock")); // fallback: 브라우저 미지원 안내
      return;
    }
    const orient = scr.orientation;
    try {
      if (isOrientationLocked) {
        await orient.unlock();
        setIsOrientationLocked(false);
        storageManager.set(ORIENTATION_LOCK_KEY, "false", { silent: true });
      } else {
        try {
          const doc = document.documentElement;
          if (doc.requestFullscreen) await doc.requestFullscreen();
          else if (
            (
              doc as unknown as {
                webkitRequestFullscreen?: () => Promise<void>;
              }
            ).webkitRequestFullscreen
          )
            await (
              doc as unknown as {
                webkitRequestFullscreen: () => Promise<void>;
              }
            ).webkitRequestFullscreen();
        } catch {
          /* 전체화면 실패해도 진행 */
        }
        const current = orient.type;
        const lockType = current.startsWith("portrait")
          ? "portrait"
          : "landscape";
        await orient.lock(lockType);
        setIsOrientationLocked(true);
        storageManager.set(ORIENTATION_LOCK_KEY, "true", { silent: true });
      }
    } catch (err) {
      console.warn("화면 고정 실패:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not allowed") || msg.includes("denied")) {
        alert(t("header.orientationUnlock")); // 또는 별도 locale 키
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(
        window.innerWidth <= 768 ||
          window.innerHeight <= 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0,
      );
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    const scr = screen as unknown as ScreenWithOrientationLock;
    if (
      typeof window === "undefined" ||
      !scr.orientation ||
      !isOrientationLocked
    )
      return;
    const orient = scr.orientation;
    const current = orient.type;
    const lockType = current.startsWith("portrait") ? "portrait" : "landscape";
    orient.lock(lockType).catch(() => {
      setIsOrientationLocked(false);
      storageManager.set(ORIENTATION_LOCK_KEY, "false", { silent: true });
    });
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SEOHead />
        <div
          className={`app-container${menuFooterHidden ? " menu-footer-hidden" : ""}`}
        >
          <Header
            onNavigate={handleNavigate}
            onStartGame={handleStartGame}
            currentScreen={currentScreen}
          />
          <GameContainer>
            {currentScreen === "guide" && (
              <GuideScreen onNavigate={handleNavigate} />
            )}
            {currentScreen === "help" && (
              <HelpScreen onNavigate={handleNavigate} />
            )}
            {currentScreen === "about" && (
              <AboutScreen onNavigate={handleNavigate} />
            )}
            {currentScreen === "privacy" && (
              <PrivacyScreen onNavigate={handleNavigate} />
            )}
            {currentScreen === "menu" && (
              <MenuScreen
                onNavigate={handleNavigate}
                onStartGame={handleStartGame}
              />
            )}
            {currentScreen === "game" && currentStage != null && (
              <GameScreen
                stageNumber={currentStage}
                onBack={handleBackFromGame}
              />
            )}
          </GameContainer>
          <Footer
            onNavigate={handleNavigate}
            onOpenContact={() => setContactModalOpen(true)}
          />
        </div>
        <ContactModal
          open={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
        />
        {isMobile &&
        typeof window !== "undefined" &&
        (screen as unknown as ScreenWithOrientationLock).orientation ? (
          <button
            type="button"
            className="orientation-lock-button"
            onClick={toggleOrientationLock}
            aria-label={
              isOrientationLocked
                ? t("header.orientationUnlock")
                : t("header.orientationLock")
            }
            title={
              isOrientationLocked
                ? t("header.orientationUnlock")
                : t("header.orientationLock")
            }
          >
            {isOrientationLocked ? "🔒" : "🔓"}
          </button>
        ) : null}
        {isMobile && (
          <button
            type="button"
            className="menu-footer-toggle"
            onClick={() => setMenuFooterHidden((v) => !v)}
            aria-label={
              menuFooterHidden
                ? t("header.showMenuFooter")
                : t("header.hideMenuFooter")
            }
            title={
              menuFooterHidden
                ? t("header.showMenuFooter")
                : t("header.hideMenuFooter")
            }
          >
            {menuFooterHidden ? "☰" : "✕"}
          </button>
        )}
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
