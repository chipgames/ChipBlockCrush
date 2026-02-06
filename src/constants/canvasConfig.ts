export const ASPECT_RATIO = 16 / 9;

/**
 * 컨테이너 크기에 맞춰 16:9 비율을 유지하는 canvas 크기 계산
 * 가로 모드에서도 정확한 크기 계산을 위해 컨테이너의 실제 가용 공간을 고려
 */
export function getCanvasSize(
  containerWidth: number,
  containerHeight: number,
  isLandscapeMode?: boolean,
): { width: number; height: number } {
  const targetRatio = ASPECT_RATIO;
  
  // 가로 모드일 때는 실제 화면 크기를 고려 (rotate 90deg 적용 시)
  let effectiveWidth = containerWidth;
  let effectiveHeight = containerHeight;
  
  // 가로 모드에서 컨테이너가 회전된 경우, 실제 가용 공간 계산
  if (isLandscapeMode && typeof window !== "undefined") {
    // 가로 모드: 화면의 실제 높이가 가용 너비가 되고, 화면의 실제 너비가 가용 높이가 됨
    // 하지만 CSS에서 이미 rotate(90deg)가 적용되어 있으므로, 컨테이너 크기는 그대로 사용
    // 다만, 실제 화면 크기를 고려하여 최대 크기 제한
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // 가로 모드에서 실제 가용 높이는 viewport의 높이에서 헤더/푸터를 제외한 값
    // 컨테이너 높이가 viewport 높이보다 클 수 있으므로, 실제 가용 공간을 계산
    if (containerHeight > viewportHeight * 0.9) {
      effectiveHeight = Math.min(containerHeight, viewportHeight * 0.85);
    }
    if (containerWidth > viewportWidth * 0.9) {
      effectiveWidth = Math.min(containerWidth, viewportWidth * 0.95);
    }
  }
  
  const containerRatio = effectiveWidth / effectiveHeight;
  let width: number;
  let height: number;
  
  if (containerRatio > targetRatio) {
    // 컨테이너가 더 넓음 - 높이 기준으로 맞춤
    height = effectiveHeight;
    width = effectiveHeight * targetRatio;
    // 너비가 컨테이너를 넘지 않도록
    if (width > effectiveWidth) {
      width = effectiveWidth;
      height = effectiveWidth / targetRatio;
    }
  } else {
    // 컨테이너가 더 높음 - 너비 기준으로 맞춤
    width = effectiveWidth;
    height = effectiveWidth / targetRatio;
    // 높이가 컨테이너를 넘지 않도록
    if (height > effectiveHeight) {
      height = effectiveHeight;
      width = effectiveHeight * targetRatio;
    }
  }
  
  return { width: Math.floor(width), height: Math.floor(height) };
}
