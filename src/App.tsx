import React, { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import MenuScreen from "@/components/screens/MenuScreen";
import ContactModal from "@/components/ui/ContactModal";
import SEOHead from "@/components/seo/SEOHead";
import ScreenOrientationLock from "@/components/ui/ScreenOrientationLock";
import OrientationLock from "@/components/ui/OrientationLock";
import type { GameScreen } from "@/types/ui";
import { useTheme } from "@/hooks/useTheme";
import { registerServiceWorker } from "@/utils/serviceWorker";
import "@/styles/App.css";

const GuideScreen = React.lazy(() => import("@/components/screens/GuideScreen"));
const HelpScreen = React.lazy(() => import("@/components/screens/HelpScreen"));
const AboutScreen = React.lazy(() => import("@/components/screens/AboutScreen"));
const PrivacyScreen = React.lazy(() => import("@/components/screens/PrivacyScreen"));
const GameScreen = React.lazy(() => import("@/components/game/GameScreen"));

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu");
  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [isUIHidden, setIsUIHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chipBlockCrush_uiHidden") === "true";
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });

  useTheme();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  // AdSense: 로컬이 아닐 때만 동적 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;
    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    if (existing) return;
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2533613198240039";
    script.onerror = () => {
      script.remove();
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0
      );
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const toggleUI = () => {
    const next = !isUIHidden;
    setIsUIHidden(next);
    localStorage.setItem("chipBlockCrush_uiHidden", String(next));
  };

  const handleNavigate = (screen: GameScreen) => {
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

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const openContactModal = () => setContactModalOpen(true);
  const closeContactModal = () => setContactModalOpen(false);

  return (
    <ErrorBoundary>
      <SEOHead />
      <div
        className="app-container"
        data-ui-hidden={isUIHidden ? "true" : undefined}
      >
        {!isUIHidden && (
          <Header
            onNavigate={handleNavigate}
            onStartGame={handleStartGame}
            currentScreen={currentScreen}
          />
        )}
        <GameContainer>
          <React.Suspense
            fallback={
              <div className="app-screen-fallback" aria-live="polite" />
            }
          >
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
          </React.Suspense>
        </GameContainer>
        {!isUIHidden && (
          <Footer
            onNavigate={handleNavigate}
            onOpenContact={openContactModal}
          />
        )}
        {isMobile && (
          <>
            <button
              type="button"
              className="ui-toggle-button"
              onClick={toggleUI}
              aria-label={isUIHidden ? "UI 표시" : "UI 숨김"}
              title={isUIHidden ? "메뉴 표시" : "메뉴 숨김"}
            >
              {isUIHidden ? "👁️" : "🙈"}
            </button>
            <ScreenOrientationLock className="screen-orientation-lock-fixed" />
            <OrientationLock className="orientation-lock-fixed" />
          </>
        )}
      </div>
      <ContactModal open={contactModalOpen} onClose={closeContactModal} />
    </ErrorBoundary>
  );
};

export default App;
