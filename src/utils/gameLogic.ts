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

export function placeBlock(
  grid: GridCell[][],
  shape: BlockShape,
  row: number,
  col: number,
  blockId: number,
): GridCell[][] {
  const next = grid.map((row) => [...row]);
  const R = shape.length;
  const C = shape[0]?.length ?? 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (shape[r][c]) next[row + r][col + c] = blockId;
    }
  }
  return next;
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
