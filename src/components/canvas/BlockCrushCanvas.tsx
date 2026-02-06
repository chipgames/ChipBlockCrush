import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import type { GridCell } from "@/types/game";
import { getCanvasSize } from "@/constants/canvasConfig";
import { getBlockColor } from "@/constants/blockShapes";
import { getColorIndexFromCell, getBlockShapeByIndex } from "@/utils/gameLogic";
import "./BlockCrushCanvas.css";

export interface BlockCrushCanvasHandle {
  getCellFromPoint: (
    clientX: number,
    clientY: number,
  ) => { row: number; col: number } | null;
  getCellSize: () => number;
}

export interface PreviewBlock {
  shape: number[][];
  row: number;
  col: number;
  colorIndex?: number;
}

export interface BlockCrushCanvasUIProps {
  score?: number;
  scoreLabel?: string;
  bestScore?: number;
  bestScoreLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  placeHintLabel?: string;
  currentBlockIndices?: number[];
  selectedIndex?: number | null;
  onBlockTrayClick?: (index: number) => void;
  onBlockTrayPointerDown?: (
    index: number,
    clientX: number,
    clientY: number,
  ) => void;
}

interface BlockCrushCanvasProps extends BlockCrushCanvasUIProps {
  grid: GridCell[][];
  onCellClick?: (row: number, col: number) => void;
  preview?: PreviewBlock | null;
  onLayout?: (layout: { cellSize: number }) => void;
  /** 가로 모드: 부모가 rotate(90deg)라서 클릭 좌표를 캔버스 좌표로 변환해야 함 */
  isLandscapeMode?: boolean;
}

/** 캔버스 좌표 기준 레이아웃 (draw·클릭·getCellFromPoint 공용) */
function getLayout(
  width: number,
  height: number,
  gridSize: number,
  blockCount: number,
) {
  const padding = 8;
  const scale = Math.min(width / 400, height / 300, 1.2);
  const topBarHeight = Math.max(28, 36 * scale);
  const rightPanelWidth = Math.max(56, 72 * scale);
  const menuBtnW = Math.max(56, 70 * scale);
  const menuBtnH = Math.max(22, 28 * scale);
  const traySlotSize = Math.max(44, 52 * scale);
  const trayGap = 4;

  const availableW = width - rightPanelWidth - padding * 2;
  const availableH = height - topBarHeight - padding * 2;
  const cellSize = Math.min(availableW / gridSize, availableH / gridSize);
  const offsetX = padding + (availableW - cellSize * gridSize) / 2;
  const offsetY =
    topBarHeight + padding + (availableH - cellSize * gridSize) / 2;

  const menuRect = {
    x: padding,
    y: padding,
    w: menuBtnW,
    h: menuBtnH,
  };

  const trayRects: { x: number; y: number; w: number; h: number }[] = [];
  const trayStartX =
    width - rightPanelWidth + (rightPanelWidth - traySlotSize) / 2;
  let trayY = topBarHeight + padding;
  for (let i = 0; i < blockCount; i++) {
    trayRects.push({
      x: trayStartX,
      y: trayY,
      w: traySlotSize,
      h: traySlotSize,
    });
    trayY += traySlotSize + trayGap;
  }

  return {
    padding,
    scale,
    topBarHeight,
    rightPanelWidth,
    menuRect,
    trayRects,
    offsetX,
    offsetY,
    cellSize,
    gridSize,
    traySlotSize,
  };
}

const BlockCrushCanvas = forwardRef<
  BlockCrushCanvasHandle,
  BlockCrushCanvasProps
>(
  (
    {
      grid,
      onCellClick,
      preview,
      score = 0,
      scoreLabel,
      bestScore = 0,
      bestScoreLabel,
      onBack,
      backLabel,
      placeHintLabel,
      currentBlockIndices = [],
      selectedIndex = null,
      onBlockTrayClick,
      onBlockTrayPointerDown,
      onLayout,
      isLandscapeMode = false,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const layoutRef = useRef<ReturnType<typeof getLayout> | null>(null);
    const isLandscapeModeRef = useRef(isLandscapeMode);
    isLandscapeModeRef.current = isLandscapeMode;
    const gridSize = grid.length;

    useImperativeHandle(
      ref,
      () => ({
        getCellFromPoint(clientX: number, clientY: number) {
          const canvas = canvasRef.current;
          if (!canvas || !layoutRef.current) return null;
          const rect = canvas.getBoundingClientRect();
          let px = clientX - rect.left;
          let py = clientY - rect.top;
          if (isLandscapeModeRef.current) {
            const W = parseInt(canvas.style.width || "0", 10);
            const H = parseInt(canvas.style.height || "0", 10);
            if (W && H) {
              const aabbX = clientX - rect.left;
              const aabbY = clientY - rect.top;
              px = aabbY;
              py = H - aabbX;
            }
          }
          const L = layoutRef.current;
          const col = Math.floor((px - L.offsetX) / L.cellSize);
          const row = Math.floor((py - L.offsetY) / L.cellSize);
          if (row >= 0 && row < L.gridSize && col >= 0 && col < L.gridSize)
            return { row, col };
          return null;
        },
        getCellSize() {
          return layoutRef.current?.cellSize ?? 24;
        },
      }),
      [],
    );

    const draw = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const blockCount = Math.max(1, currentBlockIndices.length);
        const L = getLayout(width, height, gridSize, blockCount);
        layoutRef.current = L;
        onLayout?.({ cellSize: L.cellSize });

        const {
          padding,
          scale,
          rightPanelWidth,
          menuRect,
          trayRects,
          offsetX,
          offsetY,
        } = L;

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
        const textPrimary = isLight ? "#2d2d2d" : "#e8e8e8";
        const btnBg = isLight
          ? "rgba(168, 181, 255, 0.35)"
          : "rgba(102, 126, 234, 0.4)";
        const btnStroke = isLight
          ? "rgba(124, 138, 255, 0.6)"
          : "rgba(168, 181, 255, 0.6)";

        const fontSize = Math.max(10, 12 * scale);
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        // 메뉴 버튼 (캔버스에 직접 그리기)
        if (onBack && backLabel) {
          ctx.fillStyle = btnBg;
          ctx.strokeStyle = btnStroke;
          ctx.lineWidth = 2;
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h, 8);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h);
            ctx.strokeRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h);
          }
          ctx.fillStyle = textPrimary;
          ctx.textAlign = "center";
          ctx.fillText(
            backLabel,
            menuRect.x + menuRect.w / 2,
            menuRect.y + menuRect.h / 2,
          );
          ctx.textAlign = "left";
        }

        // 점수·최고 점수 (캔버스에 직접 그리기)
        const scoreX = menuRect.x + menuRect.w + padding;
        const scoreY = menuRect.y + menuRect.h / 2;
        const lineHeight = fontSize + 2;
        ctx.textAlign = "left";
        ctx.fillStyle = textPrimary;
        ctx.fillText(
          scoreLabel != null ? `${scoreLabel}: ${score}` : String(score),
          scoreX,
          scoreY,
          width - scoreX - rightPanelWidth - padding,
        );
        if (bestScoreLabel != null) {
          ctx.fillText(
            `${bestScoreLabel}: ${bestScore}`,
            scoreX,
            scoreY + lineHeight,
            width - scoreX - rightPanelWidth - padding,
          );
        }

        // 블록 트레이 (캔버스에 직접 그리기)
        currentBlockIndices.forEach((shapeIdx, i) => {
          const r = trayRects[i];
          if (!r) return;
          const shape = getBlockShapeByIndex(shapeIdx);
          const isSelected = selectedIndex === i;
          if (isSelected) {
            ctx.fillStyle = "rgba(168, 181, 255, 0.25)";
            ctx.strokeStyle = "rgba(168, 181, 255, 0.8)";
            ctx.lineWidth = 2;
            if (typeof ctx.roundRect === "function") {
              ctx.beginPath();
              ctx.roundRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 10);
              ctx.fill();
              ctx.stroke();
            }
          }
          if (shape) {
            const rows = shape.length;
            const cols = shape[0]?.length ?? 0;
            const cell = Math.min((r.w - 8) / cols, (r.h - 8) / rows, 14);
            const startX = r.x + (r.w - cols * cell) / 2;
            const startY = r.y + (r.h - rows * cell) / 2;
            ctx.fillStyle = getBlockColor(shapeIdx);
            ctx.strokeStyle = "rgba(255,255,255,0.4)";
            ctx.lineWidth = 1;
            for (let pr = 0; pr < rows; pr++) {
              for (let pc = 0; pc < cols; pc++) {
                if (shape[pr][pc]) {
                  const px = startX + pc * cell + 1;
                  const py = startY + pr * cell + 1;
                  ctx.fillRect(px, py, cell - 2, cell - 2);
                  ctx.strokeRect(px, py, cell - 2, cell - 2);
                }
              }
            }
          }
        });

        // 그리드
        const gridPixelW = L.cellSize * gridSize;
        const gridPixelH = L.cellSize * gridSize;
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
            const x = offsetX + c * L.cellSize;
            const y = offsetY + r * L.cellSize;
            const id = grid[r][c];
            if (id > 0) {
              ctx.fillStyle = getBlockColor(getColorIndexFromCell(id));
              ctx.fillRect(x + 2, y + 2, L.cellSize - 4, L.cellSize - 4);
              ctx.strokeStyle = "rgba(255,255,255,0.35)";
              ctx.lineWidth = 1;
              ctx.strokeRect(x + 2, y + 2, L.cellSize - 4, L.cellSize - 4);
            } else {
              ctx.fillStyle = cellEmptyBg;
              ctx.fillRect(x + 1, y + 1, L.cellSize - 2, L.cellSize - 2);
              ctx.strokeStyle = cellEmptyStroke;
              ctx.lineWidth = 1;
              ctx.strokeRect(x + 1, y + 1, L.cellSize - 2, L.cellSize - 2);
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
                const px = offsetX + (preview.col + pc) * L.cellSize + 2;
                const py = offsetY + (preview.row + pr) * L.cellSize + 2;
                ctx.fillRect(px, py, L.cellSize - 4, L.cellSize - 4);
                ctx.strokeRect(px, py, L.cellSize - 4, L.cellSize - 4);
              }
            }
          }
          ctx.globalAlpha = 1;
        }
      },
      [
        grid,
        gridSize,
        preview,
        score,
        scoreLabel,
        bestScore,
        bestScoreLabel,
        backLabel,
        onBack,
        currentBlockIndices,
        selectedIndex,
        onLayout,
      ],
    );

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const updateSize = () => {
        // 컨테이너의 실제 크기 가져오기
        let w = container.clientWidth;
        let h = container.clientHeight;
        
        // 가로 모드에서 컨테이너 크기가 0이거나 비정상적인 경우, 실제 화면 크기 사용
        if (isLandscapeMode && (w === 0 || h === 0 || w > h * 3)) {
          // rotate(90deg)가 적용된 경우, 실제 가용 공간 계산
          if (typeof window !== "undefined") {
            // 가로 모드: 화면 높이가 실제 가용 너비, 화면 너비가 실제 가용 높이
            // 하지만 CSS에서 이미 회전이 적용되어 있으므로, 컨테이너의 부모 크기 확인
            const parent = container.parentElement;
            if (parent) {
              const parentRect = parent.getBoundingClientRect();
              w = parentRect.width || window.innerWidth;
              h = parentRect.height || window.innerHeight;
            } else {
              w = window.innerHeight;
              h = window.innerWidth;
            }
          }
        }
        
        // 최소 크기 보장
        w = Math.max(w, 200);
        h = Math.max(h, 112); // 200 * 9/16
        
        const { width, height } = getCanvasSize(w, h, isLandscapeMode);
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
      // 가로 모드일 때는 window resize도 감지
      if (isLandscapeMode) {
        window.addEventListener("resize", updateSize);
        window.addEventListener("orientationchange", updateSize);
        return () => {
          ro.disconnect();
          window.removeEventListener("resize", updateSize);
          window.removeEventListener("orientationchange", updateSize);
        };
      }
      return () => ro.disconnect();
    }, [draw, isLandscapeMode]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = parseInt(canvas.style.width || "0", 10);
      const h = parseInt(canvas.style.height || "0", 10);
      if (w && h) draw(ctx, w, h);
    }, [grid, draw]);

    /** 뷰포트 클릭 → 캔버스 그리기 좌표. 가로 모드(부모 rotate 90deg CW)일 때 AABB→캔버스 역회전 변환 */
    const getCanvasPoint = useCallback(
      (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const aabbX = clientX - rect.left;
        const aabbY = clientY - rect.top;
        if (!isLandscapeMode) return { px: aabbX, py: aabbY };
        const W = parseInt(canvas.style.width || "0", 10);
        const H = parseInt(canvas.style.height || "0", 10);
        if (!W || !H) return { px: aabbX, py: aabbY };
        // AABB에서 캔버스 논리: (0,0)=좌상, (H,0)=우상, (H,W)=우하, (0,W)=좌하 → cx=aabbY, cy=H-aabbX
        const cx = aabbY;
        const cy = H - aabbX;
        return { px: cx, py: cy };
      },
      [isLandscapeMode],
    );

    const handlePointerDown = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent) => {
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        const pt = getCanvasPoint(clientX, clientY);
        if (!pt || !layoutRef.current || !onBlockTrayPointerDown) return;
        const L = layoutRef.current;
        const idx = L.trayRects.findIndex(
          (r) =>
            pt.px >= r.x &&
            pt.px <= r.x + r.w &&
            pt.py >= r.y &&
            pt.py <= r.y + r.h,
        );
        if (idx >= 0) onBlockTrayPointerDown(idx, clientX, clientY);
      },
      [getCanvasPoint, onBlockTrayPointerDown],
    );

    /** 클릭/탭 시 (clientX, clientY) 기준으로 메뉴·트레이·셀 히트테스트 후 콜백 호출 (공통) */
    const performClickAt = useCallback(
      (clientX: number, clientY: number) => {
        const pt = getCanvasPoint(clientX, clientY);
        if (!pt) return;
        const { px, py } = pt;
        const L = layoutRef.current;
        if (!L) return;

        if (onBack && backLabel) {
          const m = L.menuRect;
          if (px >= m.x && px <= m.x + m.w && py >= m.y && py <= m.y + m.h) {
            onBack();
            return;
          }
        }

        const trayIdx = L.trayRects.findIndex(
          (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h,
        );
        if (trayIdx >= 0 && onBlockTrayClick) {
          onBlockTrayClick(trayIdx);
          return;
        }

        const col = Math.floor((px - L.offsetX) / L.cellSize);
        const row = Math.floor((py - L.offsetY) / L.cellSize);
        if (
          onCellClick &&
          row >= 0 &&
          row < L.gridSize &&
          col >= 0 &&
          col < L.gridSize
        ) {
          onCellClick(row, col);
        }
      },
      [getCanvasPoint, onBack, backLabel, onBlockTrayClick, onCellClick],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        performClickAt(e.clientX, e.clientY);
      },
      [performClickAt],
    );

    const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(
      null,
    );
    const handleTouchStartForTap = useCallback((e: React.TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        t: Date.now(),
      };
    }, []);
    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!start || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        const dt = Date.now() - start.t;
        if (dt <= 400 && dx * dx + dy * dy <= 400) {
          e.preventDefault();
          performClickAt(
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY,
          );
        }
      },
      [performClickAt],
    );

    return (
      <div ref={containerRef} className="block-crush-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="block-crush-canvas"
          onClick={handleClick}
          onMouseDown={handlePointerDown}
          onTouchStart={(e) => {
            handlePointerDown(e);
            handleTouchStartForTap(e);
          }}
          onTouchEnd={handleTouchEnd}
          aria-label={placeHintLabel}
        />
      </div>
    );
  },
);

BlockCrushCanvas.displayName = "BlockCrushCanvas";
export default memo(BlockCrushCanvas);
