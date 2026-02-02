import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import MenuScreen from "@/components/screens/MenuScreen";
import ContactModal from "@/components/ui/ContactModal";
import SEOHead from "@/components/seo/SEOHead";

const GuideScreen = lazy(() => import("@/components/screens/GuideScreen"));
const HelpScreen = lazy(() => import("@/components/screens/HelpScreen"));
const AboutScreen = lazy(() => import("@/components/screens/AboutScreen"));
const PrivacyScreen = lazy(() => import("@/components/screens/PrivacyScreen"));
const GameScreen = lazy(() => import("@/components/game/GameScreen"));
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

  // AdSense: 로컬이 아닐 때만 동적 로드. 광고 차단 시 net::ERR_BLOCKED_BY_CLIENT 는 브라우저/확장 프로그램 차단으로 정상.
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

  const handleNavigate = useCallback((screen: GameScreenType) => {
    setCurrentScreen(screen);
  }, []);

  const handleStartGame = useCallback(() => {
    setCurrentStage(1);
    setCurrentScreen("game");
  }, []);

  const handleBackFromGame = useCallback(() => {
    setCurrentScreen("menu");
    setCurrentStage(null);
  }, []);

  const openContactModal = useCallback(() => setContactModalOpen(true), []);
  const closeContactModal = useCallback(() => setContactModalOpen(false), []);

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
            <Suspense
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
            </Suspense>
          </GameContainer>
          <Footer
            onNavigate={handleNavigate}
            onOpenContact={openContactModal}
          />
        </div>
        <ContactModal open={contactModalOpen} onClose={closeContactModal} />
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
