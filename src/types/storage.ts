export interface GameProgress {
  highestStage: number;
  stageScores?: Record<number, number>;
}

export interface GameSettings {
  soundEnabled?: boolean;
  language?: string;
}
