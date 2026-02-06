import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { GameScreen } from "@/types/ui";
import { storageManager } from "@/utils/storage";
import MenuCanvas, { type MenuButton } from "@/components/canvas/MenuCanvas";
import "./MenuScreen.css";
// 가로/세로 모드 토글 버튼 스타일 공유
import "../game/GameScreen.css";

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

  // Canvas용 버튼 목록 생성
  const menuButtons = useMemo<MenuButton[]>(() => {
    const buttons: MenuButton[] = [
      {
        id: "play",
        label: t("header.playGame"),
        isPrimary: true,
      },
      {
        id: "guide",
        label: t("header.guide"),
      },
      {
        id: "help",
        label: t("header.help"),
      },
      {
        id: "about",
        label: t("header.about"),
      },
    ];
    if (showDownload) {
      buttons.push({
        id: "download",
        label: t("header.download"),
        isDownload: true,
      });
    }
    return buttons;
  }, [t, showDownload]);

  // 버튼 클릭 핸들러
  const handleButtonClick = useCallback(
    (buttonId: string) => {
      switch (buttonId) {
        case "play":
          onStartGame();
          break;
        case "guide":
          onNavigate("guide");
          break;
        case "help":
          onNavigate("help");
          break;
        case "about":
          onNavigate("about");
          break;
        case "download":
          handleDownload();
          break;
      }
    },
    [onStartGame, onNavigate, handleDownload],
  );

  return (
    <div className="menu-screen">
      <div className="menu-board">
        <MenuCanvas
          logoImageSrc={`${import.meta.env.BASE_URL}ChipGames_Logo.png`}
          title={t("header.gameTitle")}
          subtitle={t("menu.subtitle")}
          buttons={menuButtons}
          onButtonClick={handleButtonClick}
        />
      </div>
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
