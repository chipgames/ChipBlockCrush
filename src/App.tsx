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
import GameScreen from "@/components/game/GameScreen";
import SEOHead from "@/components/seo/SEOHead";
import { GameScreen as GameScreenType } from "@/types/ui";
import { useTheme } from "@/hooks/useTheme";
import { registerServiceWorker } from "@/utils/serviceWorker";
import "@/styles/App.css";
import "@/styles/themes.css";

const App: React.FC = () => {
  useTheme();
  useEffect(() => {
    registerServiceWorker();
  }, []);
  const [currentScreen, setCurrentScreen] = useState<GameScreenType>("menu");
  const [currentStage, setCurrentStage] = useState<number | null>(null);

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

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SEOHead />
        <div className="app-container">
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
          <Footer />
        </div>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
