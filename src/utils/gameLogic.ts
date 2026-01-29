import type { GridCell, BlockShape } from "@/types/game";
import {
  GRID_SIZE,
  POINTS_PER_BLOCK,
  LINE_BONUS,
} from "@/constants/gameConfig";
import { BLOCK_SHAPES, getBlockColor } from "@/constants/blockShapes";

export function createEmptyGrid(size: number = GRID_SIZE): GridCell[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function canPlace(
  grid: GridCell[][],
  shape: BlockShape,
  row: number,
  col: number,
): boolean {
  const R = shape.length;
  const C = shape[0]?.length ?? 0;
  const N = grid.length;
  if (row + R > N || col + C > N) return false;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (shape[r][c] && grid[row + r][col + c] !== 0) return false;
    }
  }
  return true;
}

/** 셀 값: 0 = 빈칸, 그 외 = (blockId << 4) | (colorIndex & 0xf) — 그리드 그리기 시 colorIndex로 색상 사용 */
const COLOR_BITS = 0xf;

export function placeBlock(
  grid: GridCell[][],
  shape: BlockShape,
  row: number,
  col: number,
  blockId: number,
  colorIndex: number,
): GridCell[][] {
  const next = grid.map((row) => [...row]);
  const R = shape.length;
  const C = shape[0]?.length ?? 0;
  const value = (blockId << 4) | (colorIndex & COLOR_BITS);
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (shape[r][c]) next[row + r][col + c] = value;
    }
  }
  return next;
}

export function getColorIndexFromCell(cellValue: number): number {
  return cellValue > 0 ? cellValue & COLOR_BITS : 0;
}

/** 도형의 중심(채워진 셀들의 무게중심) — 드래그 시 커서=중심으로 배치할 때 사용 */
export function getShapeCenter(shape: BlockShape): {
  row: number;
  col: number;
} {
  let sumR = 0;
  let sumC = 0;
  let count = 0;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < (shape[0]?.length ?? 0); c++) {
      if (shape[r][c]) {
        sumR += r;
        sumC += c;
        count++;
      }
    }
  }
  if (count === 0) return { row: 0, col: 0 };
  return {
    row: Math.floor(sumR / count),
    col: Math.floor(sumC / count),
  };
}

export function getFullRowsAndCols(grid: GridCell[][]): {
  rows: number[];
  cols: number[];
} {
  const N = grid.length;
  const rows: number[] = [];
  const cols: number[] = [];
  for (let i = 0; i < N; i++) {
    let fullRow = true;
    let fullCol = true;
    for (let j = 0; j < N; j++) {
      if (grid[i][j] === 0) fullRow = false;
      if (grid[j][i] === 0) fullCol = false;
    }
    if (fullRow) rows.push(i);
    if (fullCol) cols.push(i);
  }
  return { rows, cols };
}

export function clearLines(
  grid: GridCell[][],
  rows: number[],
  cols: number[],
): GridCell[][] {
  const N = grid.length;
  const next = grid.map((row) => [...row]);
  for (const r of rows) {
    for (let c = 0; c < N; c++) next[r][c] = 0;
  }
  for (const c of cols) {
    for (let r = 0; r < N; r++) next[r][c] = 0;
  }
  return next;
}

export function countBlocksInShape(shape: BlockShape): number {
  let n = 0;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < (shape[r]?.length ?? 0); c++) {
      if (shape[r][c]) n++;
    }
  }
  return n;
}

export function computeScore(
  blocksPlaced: number,
  linesClearedCount: number,
): number {
  const base = blocksPlaced * POINTS_PER_BLOCK;
  const bonus =
    LINE_BONUS[Math.min(linesClearedCount, LINE_BONUS.length - 1)] ?? 0;
  return base + bonus;
}

export function canPlaceAny(
  grid: GridCell[][],
  shapeIndices: number[],
): boolean {
  const N = grid.length;
  for (const idx of shapeIndices) {
    const shape = BLOCK_SHAPES[idx];
    if (!shape) continue;
    const R = shape.length;
    const C = shape[0]?.length ?? 0;
    for (let row = 0; row <= N - R; row++) {
      for (let col = 0; col <= N - C; col++) {
        if (canPlace(grid, shape, row, col)) return true;
      }
    }
  }
  return false;
}

export function getBlockShapeByIndex(index: number): BlockShape | null {
  return BLOCK_SHAPES[index] ?? null;
}

export { BLOCK_SHAPES, getBlockColor };
