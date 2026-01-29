/** 그리드 크기 (N x N) */
export const GRID_SIZE = 9;

/** 한 번에 주어지는 블록 개수 */
export const BLOCKS_PER_ROUND = 3;

/** 블록당 기본 점수 */
export const POINTS_PER_BLOCK = 10;

/** 동시 클리어 보너스: 1줄 +20, 2줄 +30, 3줄 +40 ... */
export const LINE_BONUS = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** 스테이지당 (클래식 모드에서는 1스테이지 = 무한 플레이, 스테이지 번호는 난이도/시드용) */
export const TOTAL_STAGES = 500;

export const STAGES_PER_PAGE = 50;
