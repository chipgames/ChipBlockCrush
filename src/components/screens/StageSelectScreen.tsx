import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { storageManager } from "@/utils/storage";
import { GameProgress } from "@/types/storage";
import { TOTAL_STAGES, STAGES_PER_PAGE } from "@/constants/gameConfig";
import "./StageSelectScreen.css";

interface StageSelectScreenProps {
  onNavigate: (
    screen: "stageSelect" | "game" | "guide" | "help" | "about",
  ) => void;
  onStartStage: (stageNumber: number) => void;
  currentScreen?: string;
}

const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  onNavigate,
  onStartStage,
  currentScreen = "stageSelect",
}) => {
  const { t } = useLanguage();
  const [unlockedStages, setUnlockedStages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(TOTAL_STAGES / STAGES_PER_PAGE);

  const loadProgress = () => {
    const progress = storageManager.get<GameProgress>("progress", {
      fallback: null,
    });
    if (progress?.highestStage != null) {
      const highest = Math.max(1, progress.highestStage);
      setUnlockedStages(highest);
      setCurrentPage(Math.ceil(highest / STAGES_PER_PAGE));
    }
  };

  useEffect(() => {
    if (currentScreen === "stageSelect") loadProgress();
  }, [currentScreen]);

  const handleStageClick = (stageNumber: number) => {
    if (stageNumber <= unlockedStages) onStartStage(stageNumber);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const startStage = (currentPage - 1) * STAGES_PER_PAGE + 1;
  const endStage = Math.min(startStage + STAGES_PER_PAGE - 1, TOTAL_STAGES);

  return (
    <div className="stage-select-screen">
      <h1 className="stage-select-title">{t("stageSelect.title")}</h1>
      <div className="stage-grid">
        {Array.from({ length: STAGES_PER_PAGE }, (_, i) => {
          const stageNumber = startStage + i;
          if (stageNumber > endStage) return null;
          const isUnlocked = stageNumber <= unlockedStages;
          return (
            <button
              key={stageNumber}
              type="button"
              className={`stage-card ${isUnlocked ? "unlocked" : "locked"}`}
              onClick={() => handleStageClick(stageNumber)}
              disabled={!isUnlocked}
            >
              {!isUnlocked && (
                <span className="stage-lock" aria-hidden>
                  🔒
                </span>
              )}
              <span className="stage-number">{stageNumber}</span>
            </button>
          );
        })}
      </div>
      <div className="stage-pagination">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="이전 페이지"
        >
          «
        </button>
        <span className="pagination-text">
          {t("stageSelect.page")} {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          className="pagination-btn pagination-next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="다음 페이지"
        >
          »
        </button>
      </div>
    </div>
  );
};

export default StageSelectScreen;
