export type GameScreen =
  | "menu"
  | "stageSelect"
  | "game"
  | "guide"
  | "help"
  | "about";

export interface ScreenState {
  currentScreen: GameScreen;
  previousScreen?: GameScreen;
}
