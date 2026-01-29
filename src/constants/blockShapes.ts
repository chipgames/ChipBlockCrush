import type { BlockShape } from "@/types/game";

/**
 * 블록 형태 정의 (2차원: 1 = 칸 존재)
 * 테트리스 스타일 + 추가 형태
 */
export const BLOCK_SHAPES: BlockShape[] = [
  [[1]], // 1x1
  [[1, 1]], // 2x1
  [[1, 1, 1]], // 3x1
  [
    [1, 1],
    [1, 1],
  ], // 2x2
  [[1, 1, 1, 1]], // 4x1 (I)
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 1, 1],
    [1, 0, 0],
  ], // L
  [
    [1, 1, 1],
    [0, 0, 1],
  ], // J
  [
    [1, 1],
    [1, 1],
    [1, 0],
  ], // 작은 L
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T (다른 방향)
  [[1], [1], [1]], // 3x1 세로
  [
    [1, 1],
    [1, 0],
  ], // 작은 L
  [
    [1, 0],
    [1, 1],
    [1, 0],
  ], // T 세로
];

/** 블록 색상 (파스텔) */
export const BLOCK_COLORS = [
  "#a8b5ff",
  "#c5a3ff",
  "#ffb3e6",
  "#7fdfd4",
  "#ffd89b",
  "#ff9f9f",
  "#b5c4ff",
  "#d4b3ff",
  "#ffc4e6",
  "#8fefdf",
  "#ffe0ab",
  "#ffafaf",
];

export function getRandomBlockId(seed: number): number {
  return Math.abs(Math.floor(Math.sin(seed) * 1e6)) % BLOCK_SHAPES.length;
}

export function getBlockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}
