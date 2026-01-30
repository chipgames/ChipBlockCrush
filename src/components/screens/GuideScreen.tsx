import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { GameScreen } from "@/types/ui";
import { BLOCK_SHAPES, getBlockColor } from "@/constants/blockShapes";
import type { BlockShape } from "@/types/game";
import "./GuideScreen.css";

interface GuideScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

/** 가이드용 블록 한 개 미리보기 (같은 칸 크기 안에 맞춤) */
function BlockShapePreview({
  shape,
  colorIndex,
}: {
  shape: BlockShape;
  colorIndex: number;
}) {
  const color = getBlockColor(colorIndex);
  const rows = shape.length;
  const cols = shape[0]?.length ?? 0;
  const cellSize = 10;
  const w = cols * cellSize;
  const h = rows * cellSize;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="guide-block-preview"
      preserveAspectRatio="xMidYMid meet"
    >
      {shape.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize + 0.5}
              y={r * cellSize + 0.5}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={color}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={0.5}
              rx={2}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

const GuideScreen: React.FC<GuideScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="guide-screen">
      <h1 className="guide-title">{t("guide.title")}</h1>
      <p className="guide-description">{t("guide.description")}</p>
      <h2 className="guide-section-title">{t("guide.basicTitle")}</h2>
      <ol className="guide-steps">
        <li>{t("guide.step1")}</li>
        <li>{t("guide.step2")}</li>
        <li>{t("guide.step3")}</li>
      </ol>
      <h2 className="guide-section-title">{t("guide.blocksTitle")}</h2>
      <p className="guide-blocks-intro">{t("guide.blocksIntro")}</p>
      <div className="guide-blocks-grid">
        {BLOCK_SHAPES.map((shape, index) => (
          <div key={index} className="guide-block-cell">
            <BlockShapePreview shape={shape} colorIndex={index} />
          </div>
        ))}
      </div>
      <h2 className="guide-section-title">{t("guide.controlsTitle")}</h2>
      <ul className="guide-list">
        <li>{t("guide.controlsPc")}</li>
        <li>{t("guide.controlsMobile")}</li>
      </ul>
      <h2 className="guide-section-title">{t("guide.tipsTitle")}</h2>
      <ul className="guide-list">
        <li>{t("guide.tips1")}</li>
        <li>{t("guide.tips2")}</li>
        <li>{t("guide.tips3")}</li>
      </ul>
      <button
        type="button"
        className="guide-back"
        onClick={() => onNavigate("menu")}
      >
        {t("header.playGame")}
      </button>
    </div>
  );
};

export default GuideScreen;
