/**
 * GameScreen.tsx
 * ---------------
 * 블록 크러시 게임의 메인 플레이 화면입니다.
 * - 그리드 상태, 현재 블록 3개, 점수, 게임 오버 관리
 * - 블록 배치(클릭/드래그), 줄 제거, 점수 계산
 * - 가로/세로 모드 토글(모바일), 드래그 시 미리보기·스냅
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/hooks/useLanguage";
import BlockCrushCanvas, {
  type BlockCrushCanvasHandle,
  type PreviewBlock,
} from "@/components/canvas/BlockCrushCanvas";
import {
  createEmptyGrid,
  canPlace,
  placeBlock,
  getFullRowsAndCols,
  clearLines,
  computeScore,
  canPlaceAny,
  getBlockShapeByIndex,
  getShapeCenter,
  getNearestValidPlacement,
} from "@/utils/gameLogic";
import { GRID_SIZE, BLOCKS_PER_ROUND } from "@/constants/gameConfig";
import { getRandomBlockId, getBlockColor } from "@/constants/blockShapes";
import type { GridCell } from "@/types/game";
import { storageManager } from "@/utils/storage";
import "./GameScreen.css";

/** 게임 화면 props: 스테이지 번호(시드용), 메뉴로 돌아가기 콜백 */
interface GameScreenProps {
  stageNumber: number;
  onBack: () => void;
}

/** localStorage에 가로 모드 여부 저장할 때 사용하는 키 (접두어 제외) */
const LANDSCAPE_MODE_KEY = "landscapeMode";

const GameScreen: React.FC<GameScreenProps> = ({ stageNumber, onBack }) => {
  const { t } = useLanguage();

  // ---- 캔버스 ref (드래그 시 셀 좌표·셀 크기 조회용) ----
  const canvasRef = useRef<BlockCrushCanvasHandle>(null);

  // ---- 그리드·블록·점수 상태 ----
  /** 현재 그리드 (각 셀: 0=빈칸, 그 외=blockId·colorIndex 인코딩) */
  const [grid, setGrid] = useState<GridCell[][]>(() =>
    createEmptyGrid(GRID_SIZE),
  );
  /** 현재 선택 가능한 블록 3개의 shape 인덱스 (BLOCK_SHAPES 기준) */
  const [currentBlockIndices, setCurrentBlockIndices] = useState<number[]>([]);
  /** 블록 트레이에서 “선택된” 블록 인덱스 (null이면 미선택, 클릭 배치 시 사용) */
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  /** 누적 점수 */
  const [score, setScore] = useState(0);
  /** 게임 오버 여부 (더 이상 배치 불가 시 true) */
  const [isGameOver, setIsGameOver] = useState(false);
  /** 다음에 배치할 블록에 부여할 고유 ID (placeBlock 시 사용) */
  const [blockIdCounter, setBlockIdCounter] = useState(1);

  // ---- 가로/세로 모드·모바일 감지 ----
  /** 가로 모드 여부. localStorage에 저장해 재방문 시 복원 */
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = storageManager.get<boolean>(LANDSCAPE_MODE_KEY, {
      fallback: false,
      silent: true,
    });
    return saved ?? false;
  });
  /** 모바일 여부 (768px 이하 또는 터치 지원). 가로/세로 토글 버튼 표시 여부에 사용 */
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      window.innerHeight <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });

  // ---- 드래그 관련 상태 ----
  /** 드래그 시작 시점: 포인터 위치 + 어떤 블록(index/shapeIdx/shape) */
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    index: number;
    shapeIdx: number;
    shape: number[][];
  } | null>(null);
  /** 드래그 중인 블록 정보 (스냅 미리보기·드롭 시 배치에 사용) */
  const [dragging, setDragging] = useState<{
    index: number;
    shapeIdx: number;
    shape: number[][];
  } | null>(null);
  /** 그리드 위에 표시할 “배치 미리보기” 셀 (row, col) */
  const [previewCell, setPreviewCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  /** 드래그 중인 포인터의 화면 좌표 (고스트 블록 위치용) */
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  /** 캔버스에서 전달받은 그리드 셀 크기 (고스트 블록 SVG 스케일용) */
  const [gridCellSize, setGridCellSize] = useState(28);

  // ---- 드래그 시 이벤트 핸들러/클로저에서 최신 값 참조용 ref ----
  const previewCellRef = useRef<{ row: number; col: number } | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const draggingRef = useRef<{
    index: number;
    shapeIdx: number;
    shape: number[][];
  } | null>(null);
  const dragStartRef = useRef<{ index: number } | null>(null);

  /** 이 거리 이상 움직였을 때만 “클릭”이 아니라 “드래그”로 인정 (px) */
  const DRAG_THRESHOLD = 8;

  /** 블록 랜덤 시드 (스테이지별로 고정 시드 + 시간으로 변화) */
  const seed = stageNumber * 1000;

  /** 현재 블록 3개를 새로 뽑아 currentBlockIndices에 설정 (시드 + 시간 기반) */
  const addNewBlocks = useCallback(() => {
    const next: number[] = [];
    for (let i = 0; i < BLOCKS_PER_ROUND; i++) {
      next.push(getRandomBlockId(seed + Date.now() + i));
    }
    setCurrentBlockIndices(next);
  }, [seed]);

  /** 마운트 시 한 번 블록 3개 생성 */
  useEffect(() => {
    addNewBlocks();
  }, [addNewBlocks]);

  /** 가로/세로 모드 토글. localStorage에 저장해 다음 방문 시 복원 */
  const toggleOrientationMode = useCallback(() => {
    const newMode = !isLandscapeMode;
    setIsLandscapeMode(newMode);
    storageManager.set(LANDSCAPE_MODE_KEY, newMode, { silent: true });
  }, [isLandscapeMode]);

  /** 리사이즈·회전 시 모바일 여부 갱신 (가로/세로 토글 버튼 표시용) */
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

  /** 그리드·현재 블록이 바뀔 때마다, 3개 중 하나라도 놓을 수 있는지 검사 → 없으면 게임 오버 */
  useEffect(() => {
    if (currentBlockIndices.length === 0) return;
    const canPlaceAnyBlock = canPlaceAny(grid, currentBlockIndices);
    if (!canPlaceAnyBlock) {
      setIsGameOver(true);
    }
  }, [grid, currentBlockIndices]);

  /**
   * 지정한 (row, col)에 blockIndex번 블록을 배치합니다.
   * - 그리드 갱신, 가득 찬 행/열 제거(반복), 점수 누적
   * - 사용한 블록 제거 후 부족하면 새 블록 1개 추가, 선택 해제
   */
  const placeBlockAt = useCallback(
    (row: number, col: number, blockIndex: number) => {
      const shapeIdx = currentBlockIndices[blockIndex];
      const shape = getBlockShapeByIndex(shapeIdx);
      if (!shape || !canPlace(grid, shape, row, col)) return;

      let nextGrid = placeBlock(
        grid,
        shape,
        row,
        col,
        blockIdCounter,
        shapeIdx,
      );
      setBlockIdCounter((c) => c + 1);

      let totalCleared = 0;
      for (;;) {
        const { rows, cols } = getFullRowsAndCols(nextGrid);
        if (rows.length === 0 && cols.length === 0) break;
        totalCleared += rows.length + cols.length;
        nextGrid = clearLines(nextGrid, rows, cols);
      }

      const blocksInShape = shape.flat().filter(Boolean).length;
      const add = computeScore(blocksInShape, totalCleared);
      setScore((s) => s + add);
      setGrid(nextGrid);

      const nextIndices = currentBlockIndices.filter(
        (_, i) => i !== blockIndex,
      );
      if (nextIndices.length < BLOCKS_PER_ROUND) {
        nextIndices.push(
          getRandomBlockId(seed + Date.now() + nextIndices.length),
        );
      }
      setCurrentBlockIndices(nextIndices);
      setSelectedIndex(null);
    },
    [grid, currentBlockIndices, blockIdCounter, seed],
  );

  /** 그리드 셀 클릭: 블록이 선택된 상태면 해당 위치에 배치 */
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (isGameOver) return;
      if (selectedIndex !== null) {
        placeBlockAt(row, col, selectedIndex);
        return;
      }
    },
    [isGameOver, selectedIndex, placeBlockAt],
  );

  /** 블록 트레이에서 포인터 다운 시 드래그 시작 (캔버스에서 호출) */
  const handleBlockTrayPointerDown = useCallback(
    (index: number, clientX: number, clientY: number) => {
      if (isGameOver) return;
      const shapeIdx = currentBlockIndices[index];
      const shape = getBlockShapeByIndex(shapeIdx);
      if (!shape) return;
      setDragStart({ x: clientX, y: clientY, index, shapeIdx, shape });
      dragStartRef.current = { index };
    },
    [currentBlockIndices, isGameOver],
  );

  /** 블록 트레이에서 클릭 시 해당 블록 선택/해제 토글 */
  const handleBlockTrayClick = useCallback(
    (index: number) => {
      if (isGameOver) return;
      setSelectedIndex((prev) => (prev === index ? null : index));
    },
    [isGameOver],
  );

  /* 이벤트 리스너 클로저에서 최신 dragging/previewCell 참조용 */
  draggingRef.current = dragging;
  previewCellRef.current = previewCell;

  /**
   * 드래그 구간에서만 전역 mouse/touch 리스너 등록.
   * - onMove: 거리 임계값 넘으면 dragging 시작, 그리드 위에서는 스냅 위치로 previewCell 갱신
   * - onEnd: 유효한 위치면 placeBlockAt 호출 후 드래그 상태 전부 초기화
   */
  useEffect(() => {
    if (!dragStart && !dragging) return;

    const onMove = (clientX: number, clientY: number) => {
      setDragPos({ x: clientX, y: clientY });
      if (dragStart && !dragging) {
        const dx = clientX - dragStart.x;
        const dy = clientY - dragStart.y;
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
          const newDrag = {
            index: dragStart.index,
            shapeIdx: dragStart.shapeIdx,
            shape: dragStart.shape,
          };
          setDragging(newDrag);
          draggingRef.current = newDrag;
          setDragStart(null);
          dragStartRef.current = null;
        }
      }
      const d = draggingRef.current;
      if (d) {
        const cell = canvasRef.current?.getCellFromPoint(clientX, clientY);
        if (cell) {
          lastCellRef.current = cell;
          const center = getShapeCenter(d.shape);
          const placeRow = cell.row - center.row;
          const placeCol = cell.col - center.col;
          let snap = canPlace(grid, d.shape, placeRow, placeCol)
            ? { row: placeRow, col: placeCol }
            : getNearestValidPlacement(grid, d.shape, cell.row, cell.col);
          if (snap) {
            setPreviewCell(snap);
            previewCellRef.current = snap;
          } else {
            setPreviewCell(null);
            previewCellRef.current = null;
          }
        } else {
          setPreviewCell(null);
          previewCellRef.current = null;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onEnd = () => {
      const pc = previewCellRef.current;
      const d = draggingRef.current;
      const lastCell = lastCellRef.current;
      if (d) {
        let place =
          pc && canPlace(grid, d.shape, pc.row, pc.col)
            ? pc
            : lastCell
              ? getNearestValidPlacement(
                  grid,
                  d.shape,
                  lastCell.row,
                  lastCell.col,
                )
              : null;
        if (place) placeBlockAt(place.row, place.col, d.index);
      }
      setDragging(null);
      setDragStart(null);
      setPreviewCell(null);
      setDragPos(null);
      previewCellRef.current = null;
      lastCellRef.current = null;
      draggingRef.current = null;
      dragStartRef.current = null;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      onEnd();
    };

    const onTouchEnd = () => {
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      onEnd();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchend", onTouchEnd, { capture: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
    };
  }, [dragStart, dragging, grid, placeBlockAt]);

  /** 캔버스에 그릴 “배치 미리보기” 블록. 유효한 위치일 때만 BlockCrushCanvas에 전달 */
  const preview: PreviewBlock | null = useMemo(() => {
    if (
      !dragging ||
      !previewCell ||
      !canPlace(grid, dragging.shape, previewCell.row, previewCell.col)
    ) {
      return null;
    }
    return {
      shape: dragging.shape,
      row: previewCell.row,
      col: previewCell.col,
      colorIndex: dragging.shapeIdx,
    };
  }, [dragging, previewCell, grid]);

  /** 게임 오버 후 “다시 하기”: 그리드·점수·블록·드래그 상태 초기화 후 블록 3개 재생성 */
  const handlePlayAgain = () => {
    setGrid(createEmptyGrid(GRID_SIZE));
    setScore(0);
    setIsGameOver(false);
    setSelectedIndex(null);
    setDragging(null);
    setPreviewCell(null);
    setBlockIdCounter(1);
    addNewBlocks();
  };

  return (
    <div className="game-screen">
      {/* 가로 모드 시 rotate(90deg)로 전체 게임 영역 회전, 모바일에서만 */}
      <div
        className={`game-board-container ${isLandscapeMode ? "landscape-mode" : ""}`}
      >
        <div className={`game-area ${isGameOver ? "game-over" : ""}`}>
          <div className="game-view-16-9">
            {/* 그리드·메뉴·점수·블록트레이를 모두 캔버스에 그리며, 클릭/드래그는 여기서 처리 */}
            <BlockCrushCanvas
              ref={canvasRef}
              grid={grid}
              onCellClick={handleCellClick}
              preview={preview}
              onLayout={(layout) => setGridCellSize(layout.cellSize)}
              score={score}
              scoreLabel={t("game.score")}
              onBack={onBack}
              backLabel={t("game.backToStage")}
              placeHintLabel={t("game.placeHint")}
              currentBlockIndices={currentBlockIndices}
              selectedIndex={selectedIndex}
              onBlockTrayClick={handleBlockTrayClick}
              onBlockTrayPointerDown={handleBlockTrayPointerDown}
              isLandscapeMode={isLandscapeMode}
            />
          </div>
        </div>
      </div>

      {/* 모바일에서만: 가로/세로 모드 토글 버튼 (고정 위치) */}
      {isMobile && (
        <button
          type="button"
          className={`orientation-toggle-button ${isLandscapeMode ? "landscape-mode" : ""}`}
          onClick={toggleOrientationMode}
          aria-label={
            isLandscapeMode
              ? t("game.switchToPortrait")
              : t("game.switchToLandscape")
          }
          title={
            isLandscapeMode
              ? t("game.switchToPortrait")
              : t("game.switchToLandscape")
          }
        >
          <span className="orientation-icon">
            {isLandscapeMode ? "📱" : "🔄"}
          </span>
          <span className="orientation-text">
            {isLandscapeMode ? t("game.portraitMode") : t("game.landscapeMode")}
          </span>
        </button>
      )}

      {/* 드래그 중: 커서를 따라다니는 블록 고스트. body 포탈로 회전 컨테이너 영향 제거, 가로 모드 시 역회전으로 블록 방향 맞춤 */}
      {dragging &&
        dragPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`game-drag-ghost ${isLandscapeMode ? "landscape-mode" : ""}`}
            style={{ left: dragPos.x, top: dragPos.y }}
            aria-hidden
          >
            <BlockPreview
              shape={dragging.shape}
              colorIndex={dragging.shapeIdx}
              size={gridCellSize}
            />
          </div>,
          document.body,
        )}

      {/* 게임 오버 시: 점수 표시 + 다시 하기 / 메뉴로 버튼 */}
      {isGameOver && (
        <div className="game-overlay">
          <div className="game-over-box">
            <h2>{t("game.gameOver")}</h2>
            <p>
              {t("game.score")}: {score}
            </p>
            <div className="game-over-buttons">
              <button type="button" onClick={handlePlayAgain}>
                {t("game.playAgain")}
              </button>
              <button type="button" onClick={onBack}>
                {t("game.backToStage")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 드래그 고스트용 블록 미리보기 SVG.
 * shape(2차원 배열), colorIndex(색상), size(셀 픽셀)로 작은 블록 하나를 그림.
 */
function BlockPreview({
  shape,
  colorIndex,
  size = 24,
}: {
  shape: number[][];
  colorIndex: number;
  size?: number;
}) {
  const color = getBlockColor(colorIndex);
  const rows = shape.length;
  const cols = shape[0]?.length ?? 0;
  const cellSize = size;
  const w = cols * cellSize;
  const h = rows * cellSize;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="block-preview-svg"
    >
      {shape.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize + 2}
              y={r * cellSize + 2}
              width={cellSize - 4}
              height={cellSize - 4}
              fill={color}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1}
              rx={4}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export default GameScreen;
