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
import { useCanvasOrientation } from "@/contexts/CanvasOrientationContext";
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
import { soundManager } from "@/utils/SoundManager";
import "./GameScreen.css";

/** 게임 화면 props: 스테이지 번호(시드용), 메뉴로 돌아가기 콜백 */
interface GameScreenProps {
  stageNumber: number;
  onBack: () => void;
}

/** localStorage에 최고 점수 저장할 때 사용하는 키 */
const HIGH_SCORE_KEY = "highScore";

const GameScreen: React.FC<GameScreenProps> = ({ stageNumber, onBack }) => {
  const { t } = useLanguage();
  const { orientation } = useCanvasOrientation();

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
  /** 최고 점수 (localStorage에서 복원, 갱신 시 저장) */
  const [bestScore, setBestScore] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = storageManager.get<number>(HIGH_SCORE_KEY, {
      fallback: 0,
      silent: true,
    });
    return typeof v === "number" && v >= 0 ? v : 0;
  });
  /** 게임 오버 여부 (더 이상 배치 불가 시 true) */
  const [isGameOver, setIsGameOver] = useState(false);
  /** 다음에 배치할 블록에 부여할 고유 ID (placeBlock 시 사용) */
  const [blockIdCounter, setBlockIdCounter] = useState(1);


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
  /** 드래그 고스트 DOM — 터치 이동 시 setState 대신 직접 위치 갱신해 끊김 감소 */
  const ghostRef = useRef<HTMLDivElement | null>(null);
  /** 그리드 스냅 계산 RAF 스로틀용 */
  const moveRafRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);

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



  /** 그리드·현재 블록이 바뀔 때마다, 3개 중 하나라도 놓을 수 있는지 검사 → 없으면 게임 오버 */
  useEffect(() => {
    if (currentBlockIndices.length === 0) return;
    const canPlaceAnyBlock = canPlaceAny(grid, currentBlockIndices);
    if (!canPlaceAnyBlock) {
      setIsGameOver(true);
    }
  }, [grid, currentBlockIndices]);

  /** 점수가 올라갈 때 최고 점수 갱신 및 저장 */
  useEffect(() => {
    if (score <= bestScore) return;
    setBestScore(score);
    storageManager.set(HIGH_SCORE_KEY, score, { silent: true });
  }, [score, bestScore]);

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

      soundManager.playPlace();

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
      const d = draggingRef.current;
      if (d && ghostRef.current) {
        ghostRef.current.style.left = `${clientX}px`;
        ghostRef.current.style.top = `${clientY}px`;
      } else {
        setDragPos({ x: clientX, y: clientY });
      }
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
          setDragPos({ x: clientX, y: clientY });
        }
      }
      if (d) {
        pendingMoveRef.current = { x: clientX, y: clientY };
        if (moveRafRef.current == null) {
          moveRafRef.current = requestAnimationFrame(() => {
            moveRafRef.current = null;
            const pos = pendingMoveRef.current;
            const g = draggingRef.current;
            if (!pos || !g) return;
            const cell = canvasRef.current?.getCellFromPoint(pos.x, pos.y);
            if (cell) {
              lastCellRef.current = cell;
              const center = getShapeCenter(g.shape);
              const placeRow = cell.row - center.row;
              const placeCol = cell.col - center.col;
              const snap = canPlace(grid, g.shape, placeRow, placeCol)
                ? { row: placeRow, col: placeCol }
                : getNearestValidPlacement(grid, g.shape, cell.row, cell.col);
              if (snap) {
                const prev = previewCellRef.current;
                if (!prev || prev.row !== snap.row || prev.col !== snap.col) {
                  setPreviewCell(snap);
                  previewCellRef.current = snap;
                }
              } else {
                if (previewCellRef.current !== null) {
                  setPreviewCell(null);
                  previewCellRef.current = null;
                }
              }
            } else {
              if (previewCellRef.current !== null) {
                setPreviewCell(null);
                previewCellRef.current = null;
              }
            }
          });
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      // 이벤트가 취소 가능한 경우에만 preventDefault 호출
      if (e.cancelable) {
        e.preventDefault();
      }
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onEnd = (releaseClientX?: number, releaseClientY?: number) => {
      const pc = previewCellRef.current;
      const d = draggingRef.current;
      const lastCell = lastCellRef.current;
      if (d) {
        const hasReleasePos = releaseClientX != null && releaseClientY != null;
        const releaseOverGrid =
          hasReleasePos &&
          canvasRef.current?.getCellFromPoint(releaseClientX, releaseClientY) !=
            null;
        if (hasReleasePos && !releaseOverGrid) {
          /* 놓은 위치가 그리드 밖이면 취소(배치 안 함) */
        } else {
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
      }
      if (moveRafRef.current != null) {
        cancelAnimationFrame(moveRafRef.current);
        moveRafRef.current = null;
      }
      pendingMoveRef.current = null;
      setDragging(null);
      setDragStart(null);
      setPreviewCell(null);
      setDragPos(null);
      previewCellRef.current = null;
      lastCellRef.current = null;
      draggingRef.current = null;
      dragStartRef.current = null;
    };

    const onMouseUp = (e: MouseEvent) => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      onEnd(e.clientX, e.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      const touch = e.changedTouches[0];
      onEnd(touch?.clientX, touch?.clientY);
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

  /** 캔버스 레이아웃 수신 (셀 크기 → 드래그 고스트 스케일용). 참조 안정화로 캔버스 리렌더 감소 */
  const handleLayout = useCallback((layout: { cellSize: number }) => {
    setGridCellSize(layout.cellSize);
  }, []);

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
      <div className={`game-area ${isGameOver ? "game-over" : ""}`}>
        <div className="game-board">
            {/* 그리드·메뉴·점수·블록트레이를 모두 캔버스에 그리며, 클릭/드래그는 여기서 처리 */}
            <BlockCrushCanvas
              ref={canvasRef}
              grid={grid}
              onCellClick={handleCellClick}
              preview={preview}
              onLayout={handleLayout}
              score={score}
              scoreLabel={t("game.score")}
              bestScore={bestScore}
              bestScoreLabel={t("game.bestScore")}
              onBack={onBack}
              backLabel={t("game.backToStage")}
              placeHintLabel={t("game.placeHint")}
              currentBlockIndices={currentBlockIndices}
              selectedIndex={selectedIndex}
              onBlockTrayClick={handleBlockTrayClick}
              onBlockTrayPointerDown={handleBlockTrayPointerDown}
            />
        </div>
      </div>

      {/* 드래그 중: 커서를 따라다니는 블록 고스트. body 포탈로 회전 컨테이너 영향 제거, 세로 모드 시 캔버스와 동일한 방향으로 회전 */}
      {dragging && dragPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={ghostRef}
            className="game-drag-ghost"
            style={{
              left: dragPos.x,
              top: dragPos.y,
              transform: orientation === "portrait" 
                ? "translate(-50%, -50%) rotate(90deg)" 
                : "translate(-50%, -50%)",
            }}
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
            <p className="game-over-best">
              {t("game.bestScore")}: {bestScore}
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
 * getShapeCenter 기준으로 도형 중심을 SVG 중심에 맞추고, 이동 후 잘리지 않도록 viewBox를 넓힘.
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
  const center = getShapeCenter(shape);
  const shapeCenterPxX = center.col * cellSize + cellSize / 2;
  const shapeCenterPxY = center.row * cellSize + cellSize / 2;
  const dx = w / 2 - shapeCenterPxX;
  const dy = h / 2 - shapeCenterPxY;
  const padding = 4;
  const viewMinX = Math.min(0, dx) - padding;
  const viewMinY = Math.min(0, dy) - padding;
  const viewW = w + Math.abs(dx) + padding * 2;
  const viewH = h + Math.abs(dy) + padding * 2;
  return (
    <svg
      width={viewW}
      height={viewH}
      viewBox={`${viewMinX} ${viewMinY} ${viewW} ${viewH}`}
      className="block-preview-svg"
    >
      <g transform={`translate(${dx}, ${dy})`}>
        {shape.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize + 1}
                y={r * cellSize + 1}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={color}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                rx={4}
              />
            ) : null,
          ),
        )}
      </g>
    </svg>
  );
}

export default GameScreen;
