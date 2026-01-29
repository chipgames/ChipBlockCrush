import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
import {
  BLOCK_SHAPES,
  getRandomBlockId,
  getBlockColor,
} from "@/constants/blockShapes";
import type { GridCell } from "@/types/game";
import "./GameScreen.css";

interface GameScreenProps {
  stageNumber: number;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ stageNumber, onBack }) => {
  const { t } = useLanguage();
  const canvasRef = useRef<BlockCrushCanvasHandle>(null);
  const [grid, setGrid] = useState<GridCell[][]>(() =>
    createEmptyGrid(GRID_SIZE),
  );
  const [currentBlockIndices, setCurrentBlockIndices] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [blockIdCounter, setBlockIdCounter] = useState(1);

  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    index: number;
    shapeIdx: number;
    shape: number[][];
  } | null>(null);
  const [dragging, setDragging] = useState<{
    index: number;
    shapeIdx: number;
    shape: number[][];
  } | null>(null);
  const [previewCell, setPreviewCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [gridCellSize, setGridCellSize] = useState(28);
  const previewCellRef = useRef<{ row: number; col: number } | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const draggingRef = useRef<{
    index: number;
    shapeIdx: number;
    shape: number[][];
  } | null>(null);
  const dragStartRef = useRef<{ index: number } | null>(null);
  const DRAG_THRESHOLD = 8;

  const seed = stageNumber * 1000;

  const addNewBlocks = useCallback(() => {
    const next: number[] = [];
    for (let i = 0; i < BLOCKS_PER_ROUND; i++) {
      next.push(getRandomBlockId(seed + Date.now() + i));
    }
    setCurrentBlockIndices(next);
  }, [seed]);

  useEffect(() => {
    addNewBlocks();
  }, [addNewBlocks]);

  useEffect(() => {
    if (currentBlockIndices.length === 0) return;
    const canPlaceAnyBlock = canPlaceAny(grid, currentBlockIndices);
    if (!canPlaceAnyBlock) {
      setIsGameOver(true);
    }
  }, [grid, currentBlockIndices]);

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

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, index: number) => {
      if (isGameOver) return;
      const shapeIdx = currentBlockIndices[index];
      const shape = getBlockShapeByIndex(shapeIdx);
      if (!shape) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX, y: clientY, index, shapeIdx, shape });
      dragStartRef.current = { index };
    },
    [currentBlockIndices, isGameOver],
  );

  draggingRef.current = dragging;
  previewCellRef.current = previewCell;

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
      const startIdx = dragStartRef.current?.index;
      if (!d && startIdx !== undefined) {
        setSelectedIndex((prev) => (prev === startIdx ? null : startIdx));
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
        <div className="game-view-16-9">
          <div className="game-canvas-box">
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
              blockTrayContent={currentBlockIndices.map((shapeIdx, i) => {
                const shape = BLOCK_SHAPES[shapeIdx];
                const isSelected = selectedIndex === i;
                const isDraggingThis = dragging?.index === i;
                if (!shape) return null;
                return (
                  <div
                    key={`${shapeIdx}-${i}`}
                    className={`game-block-preview ${isSelected ? "selected" : ""} ${isDraggingThis ? "dragging" : ""}`}
                    onMouseDown={(e) => handlePointerDown(e, i)}
                    onTouchStart={(e) => handlePointerDown(e, i)}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!dragging) setSelectedIndex(isSelected ? null : i);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedIndex(isSelected ? null : i);
                      }
                    }}
                  >
                    <BlockPreview shape={shape} colorIndex={shapeIdx} />
                  </div>
                );
              })}
            />
          </div>
        </div>
      </div>

      {dragging && dragPos && (
        <div
          className="game-drag-ghost"
          style={{ left: dragPos.x, top: dragPos.y }}
          aria-hidden
        >
          <BlockPreview
            shape={dragging.shape}
            colorIndex={dragging.shapeIdx}
            size={gridCellSize}
          />
        </div>
      )}

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
