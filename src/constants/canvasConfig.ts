export const ASPECT_RATIO = 16 / 9;

export function getCanvasSize(
  containerWidth: number,
  containerHeight: number,
): { width: number; height: number } {
  const targetRatio = ASPECT_RATIO;
  const containerRatio = containerWidth / containerHeight;
  let width: number;
  let height: number;
  if (containerRatio > targetRatio) {
    height = containerHeight;
    width = containerHeight * targetRatio;
  } else {
    width = containerWidth;
    height = containerWidth / targetRatio;
  }
  return { width: Math.floor(width), height: Math.floor(height) };
}
