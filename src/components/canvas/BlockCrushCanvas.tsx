import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { GridCell } from "@/types/game";
import { getCanvasSize } from "@/constants/canvasConfig";
import { getBlockColor } from "@/constants/blockShapes";
import { getColorIndexFromCell } from "@/utils/gameLogic";
import "./BlockCrushCanvas.css";

const GRID_SIZE = 9;

export interface BlockCrushCanvasHandle {
  getCellFromPoint: (
    clientX: number,
    clientY: number,
  ) => { row: number; col: number } | null;
}

export interface PreviewBlock {
  shape: number[][];
  row: number;
  col: number;
  colorIndex?: number;
}

interface BlockCrushCanvasProps {
  grid: GridCell[][];
  onCellClick?: (row: number, col: number) => void;
  preview?: PreviewBlock | null;
}

const BlockCrushCanvas = forwardRef<
  BlockCrushCanvasHandle,
  BlockCrushCanvasProps
>(({ grid, onCellClick, preview }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<{
    offsetX: number;
    offsetY: number;
    cellSize: number;
    gridSize: number;
    padding: number;
  } | null>(null);
  const gridSize = grid.length;

  useImperativeHandle(
    ref,
    () => ({
      getCellFromPoint(clientX: number, clientY: number) {
        const canvas = canvasRef.current;
        if (!canvas || !layoutRef.current) return null;
        const rect = canvas.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const { offsetX, offsetY, cellSize, gridSize: n } = layoutRef.current;
        const col = Math.floor((px - offsetX) / cellSize);
        const row = Math.floor((py - offsetY) / cellSize);
        if (row >= 0 && row < n && col >= 0 && col < n) return { row, col };
        return null;
      },
    }),
    [],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const padding = 8;
      const availableW = width - padding * 2;
      const availableH = height - padding * 2;
      const cellSize = Math.min(availableW / gridSize, availableH / gridSize);
      const offsetX = padding + (availableW - cellSize * gridSize) / 2;
      const offsetY = padding + (availableH - cellSize * gridSize) / 2;

      layoutRef.current = {
        offsetX,
        offsetY,
        cellSize,
        gridSize,
        padding,
      };

      const gridPixelW = cellSize * gridSize;
      const gridPixelH = cellSize * gridSize;
      const radius = 8;

      ctx.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--canvas-bg")
          .trim() || "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      const isLight =
        document.documentElement.getAttribute("data-theme") === "light";
      const gridBg = isLight
        ? "rgba(220, 222, 235, 0.95)"
        : "rgba(40, 42, 62, 0.95)";
      const gridBorder = isLight
        ? "rgba(124, 138, 255, 0.55)"
        : "rgba(168, 181, 255, 0.5)";
      const cellEmptyBg = isLight
        ? "rgba(0,0,0,0.03)"
        : "rgba(255,255,255,0.04)";
      const cellEmptyStroke = isLight
        ? "rgba(0,0,0,0.12)"
        : "rgba(255,255,255,0.22)";

      const gx = offsetX - 2;
      const gy = offsetY - 2;
      const gw = gridPixelW + 4;
      const gh = gridPixelH + 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(gx, gy, gw, gh, radius);
      } else {
        ctx.rect(gx, gy, gw, gh);
      }
      ctx.fillStyle = gridBg;
      ctx.fill();
      ctx.strokeStyle = gridBorder;
      ctx.lineWidth = 3;
      ctx.stroke();

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const x = offsetX + c * cellSize;
          const y = offsetY + r * cellSize;
          const id = grid[r][c];
          if (id > 0) {
            ctx.fillStyle = getBlockColor(getColorIndexFromCell(id));
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            ctx.strokeStyle = "rgba(255,255,255,0.35)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          } else {
            ctx.fillStyle = cellEmptyBg;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = cellEmptyStroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          }
        }
      }

      if (preview && preview.shape) {
        const color =
          preview.colorIndex !== undefined
            ? getBlockColor(preview.colorIndex)
            : "rgba(168, 181, 255, 0.6)";
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        const R = preview.shape.length;
        const C = preview.shape[0]?.length ?? 0;
        for (let pr = 0; pr < R; pr++) {
          for (let pc = 0; pc < C; pc++) {
            if (preview.shape[pr][pc]) {
              const px = offsetX + (preview.col + pc) * cellSize + 2;
              const py = offsetY + (preview.row + pr) * cellSize + 2;
              ctx.fillRect(px, py, cellSize - 4, cellSize - 4);
              ctx.strokeRect(px, py, cellSize - 4, cellSize - 4);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
    },
    [grid, gridSize, preview],
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const { width, height } = getCanvasSize(w, h);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      draw(ctx, width, height);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = parseInt(canvas.style.width || "0", 10);
    const h = parseInt(canvas.style.height || "0", 10);
    if (w && h) draw(ctx, w, h);
  }, [grid, draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const padding = 8;
    const logicalW = rect.width;
    const logicalH = rect.height;
    const availableW = logicalW - padding * 2;
    const availableH = logicalH - padding * 2;
    const cellSize = Math.min(availableW / gridSize, availableH / gridSize);
    const offsetX = padding + (availableW - cellSize * gridSize) / 2;
    const offsetY = padding + (availableH - cellSize * gridSize) / 2;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const col = Math.floor((px - offsetX) / cellSize);
    const row = Math.floor((py - offsetY) / cellSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      onCellClick(row, col);
    }
  };

  return (
    <div ref={containerRef} className="block-crush-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="block-crush-canvas"
        onClick={handleClick}
      />
    </div>
  );
});

BlockCrushCanvas.displayName = "BlockCrushCanvas";
export default BlockCrushCanvas;
