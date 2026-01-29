/** 그리드 한 칸: 0 = 빈칸, 1 이상 = 블록 ID */
export type GridCell = number;

/** 블록 형태: 2차원 배열, 1 = 칸 존재 */
export type BlockShape = number[][];

export interface BlockDefinition {
  id: number;
  shape: BlockShape;
  color?: string;
}

/** 보드 상태: gridSize x gridSize */
export interface BoardState {
  grid: GridCell[][];
  gridSize: number;
}

export interface GameState {
  board: BoardState;
  currentBlocks: BlockDefinition[];
  score: number;
  level: number;
  isGameOver: boolean;
  linesCleared: number;
}
