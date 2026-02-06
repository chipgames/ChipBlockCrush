import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  memo,
} from "react";
import { useCanvasOrientation } from "@/contexts/CanvasOrientationContext";
import "./MenuCanvas.css";

const ASPECT_RATIO_LANDSCAPE = 16 / 9;
const ASPECT_RATIO_PORTRAIT = 9 / 16;
const MAX_WIDTH = 1200;
const MIN_WIDTH = 280;
const MIN_HEIGHT_LANDSCAPE = Math.floor(MIN_WIDTH / ASPECT_RATIO_LANDSCAPE);
const MIN_HEIGHT_PORTRAIT = Math.floor(MIN_WIDTH / ASPECT_RATIO_PORTRAIT);

export interface MenuButton {
  id: string;
  label: string;
  isPrimary?: boolean;
  isDownload?: boolean;
}

interface MenuCanvasProps {
  logoImageSrc: string;
  title: string;
  subtitle: string;
  buttons: MenuButton[];
  onButtonClick: (buttonId: string) => void;
}

const MenuCanvas: React.FC<MenuCanvasProps> = ({
  logoImageSrc,
  title,
  subtitle,
  buttons,
  onButtonClick,
}) => {
  const { orientation } = useCanvasOrientation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const aspectRatio =
    orientation === "landscape"
      ? ASPECT_RATIO_LANDSCAPE
      : ASPECT_RATIO_PORTRAIT;
  const minHeight =
    orientation === "landscape"
      ? MIN_HEIGHT_LANDSCAPE
      : MIN_HEIGHT_PORTRAIT;
  const [size, setSize] = useState({ w: MIN_WIDTH, h: minHeight });
  const layoutRef = useRef<{
    width: number;
    height: number;
    padding: number;
    logoHeight: number;
    logoY: number;
    titleY: number;
    subtitleY: number;
    playButtonY: number;
    playButtonH: number;
    linksY: number;
    linkButtonH: number;
    linkButtonGap: number;
    fontSize: {
      title: number;
      subtitle: number;
      playButton: number;
      linkButton: number;
    };
  } | null>(null);

  // 로고 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImageRef.current = img;
      setLogoLoaded(true);
    };
    img.onerror = () => {
      setLogoLoaded(false);
    };
    img.src = logoImageSrc;
  }, [logoImageSrc]);

  // 레이아웃 계산 (16:9 비율 기준, 모바일 친화적 - 모든 요소가 Canvas 안에 들어가도록)
  const calculateLayout = useCallback(
    (width: number, height: number) => {
      // 세로 모드일 때는 가로/세로를 스왑하여 계산
      const effectiveW = orientation === "portrait" ? height : width;
      const effectiveH = orientation === "portrait" ? width : height;
      
      // 모바일 기준 스케일: 작은 화면에서도 적절한 크기 유지
      // 기준: 가로 400px 또는 세로 225px (16:9 비율)
      const baseWidth = 400;
      const baseHeight = 225;
      let scale = Math.min(effectiveW / baseWidth, effectiveH / baseHeight, 1.5);
      
      // 패딩: 화면 크기에 비례하되 최소값 보장
      const padding = Math.max(8, Math.min(effectiveW * 0.03, effectiveH * 0.03));
      
      // 예상 요소 높이 계산 (버튼 개수는 나중에 확인)
      const estimatedLinkButtonCount = 4; // 가이드, 도움말, 게임소개, 다운로드
      
      // 초기 크기 계산
      let logoHeight = Math.max(40, Math.min(70 * scale, effectiveH * 0.12));
      let titleFontSize = Math.max(18, Math.min(28 * scale, effectiveW * 0.07));
      let subtitleFontSize = Math.max(11, Math.min(16 * scale, effectiveW * 0.04));
      let playButtonFontSize = Math.max(14, Math.min(22 * scale, effectiveW * 0.055));
      let linkButtonFontSize = Math.max(11, Math.min(14 * scale, effectiveW * 0.035));
      
      let titleY = padding + logoHeight;
      let subtitleY = titleY + titleFontSize;
      let playButtonH = Math.max(40, Math.min(50 * scale, effectiveH * 0.07));
      let playButtonY = subtitleY + subtitleFontSize;
      let linkButtonH = Math.max(28, Math.min(38 * scale, effectiveH * 0.06));
      let linkButtonGap = Math.max(6, Math.min(12 * scale, effectiveW * 0.015));
      let linksY = playButtonY + playButtonH;
      
      // 요소 간 간격 계산
      const logoTitleGap = Math.max(12, 20 * scale);
      const titleSubtitleGap = Math.max(6, 10 * scale);
      const subtitleButtonGap = Math.max(16, 24 * scale);
      const buttonLinksGap = Math.max(12, 20 * scale);
      
      // 전체 높이 계산 (상대적 위치 기준)
      const totalHeight = logoHeight + logoTitleGap + titleFontSize + titleSubtitleGap + 
                         subtitleFontSize + subtitleButtonGap + playButtonH + 
                         buttonLinksGap + linkButtonH;
      
      // Canvas 높이를 초과하면 스케일 조정
      if (totalHeight > effectiveH - padding * 2) {
        const availableHeight = effectiveH - padding * 2;
        const scaleFactor = availableHeight / totalHeight;
        scale *= scaleFactor * 0.95; // 여유 공간 확보
        
        // 스케일 조정 후 재계산
        logoHeight = Math.max(35, Math.min(70 * scale, effectiveH * 0.12));
        titleFontSize = Math.max(16, Math.min(28 * scale, effectiveW * 0.07));
        subtitleFontSize = Math.max(10, Math.min(16 * scale, effectiveW * 0.04));
        playButtonFontSize = Math.max(13, Math.min(22 * scale, effectiveW * 0.055));
        linkButtonFontSize = Math.max(10, Math.min(14 * scale, effectiveW * 0.035));
        playButtonH = Math.max(36, Math.min(50 * scale, effectiveH * 0.07));
        linkButtonH = Math.max(26, Math.min(38 * scale, effectiveH * 0.06));
        linkButtonGap = Math.max(5, Math.min(12 * scale, effectiveW * 0.015));
        
        // 간격 재계산
        const recalcLogoTitleGap = Math.max(12, 20 * scale);
        const recalcTitleSubtitleGap = Math.max(6, 10 * scale);
        const recalcSubtitleButtonGap = Math.max(16, 24 * scale);
        const recalcButtonLinksGap = Math.max(12, 20 * scale);
        
        // 전체 높이 재계산
        const recalcTotalHeight = logoHeight + recalcLogoTitleGap + titleFontSize + 
                                  recalcTitleSubtitleGap + subtitleFontSize + 
                                  recalcSubtitleButtonGap + playButtonH + 
                                  recalcButtonLinksGap + linkButtonH;
        
        // 중앙 정렬을 위한 시작 Y 위치 계산
        const startY = (effectiveH - recalcTotalHeight) / 2;
        
        // 각 요소의 Y 위치 계산 (중앙 기준)
        const logoY = startY;
        titleY = logoY + logoHeight + recalcLogoTitleGap;
        subtitleY = titleY + titleFontSize + recalcTitleSubtitleGap;
        playButtonY = subtitleY + subtitleFontSize + recalcSubtitleButtonGap;
        linksY = playButtonY + playButtonH + recalcButtonLinksGap;
        
        layoutRef.current = {
          width,
          height,
          padding,
          logoHeight,
          logoY,
          titleY,
          subtitleY,
          playButtonY,
          playButtonH,
          linksY,
          linkButtonH,
          linkButtonGap,
          fontSize: {
            title: titleFontSize,
            subtitle: subtitleFontSize,
            playButton: playButtonFontSize,
            linkButton: linkButtonFontSize,
          },
        };
      } else {
        // Canvas 높이 내에 들어가는 경우에도 중앙 정렬
        const startY = (effectiveH - totalHeight) / 2;
        
        const logoY = startY;
        titleY = logoY + logoHeight + logoTitleGap;
        subtitleY = titleY + titleFontSize + titleSubtitleGap;
        playButtonY = subtitleY + subtitleFontSize + subtitleButtonGap;
        linksY = playButtonY + playButtonH + buttonLinksGap;
        
        layoutRef.current = {
          width,
          height,
          padding,
          logoHeight,
          logoY,
          titleY,
          subtitleY,
          playButtonY,
          playButtonH,
          linksY,
          linkButtonH,
          linkButtonGap,
          fontSize: {
            title: titleFontSize,
            subtitle: subtitleFontSize,
            playButton: playButtonFontSize,
            linkButton: linkButtonFontSize,
          },
        };
      }
    },
    [orientation],
  );

  // Canvas 그리기
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!layoutRef.current) return;

      // 세로 모드일 때는 가로/세로를 스왑하여 계산
      const effectiveW = orientation === "portrait" ? height : width;
      const effectiveH = orientation === "portrait" ? width : height;

      const L = layoutRef.current;
      const { padding, logoHeight, logoY, fontSize } = L;
      
      // 세로 모드일 때는 Canvas를 90도 회전하여 그리기
      if (orientation === "portrait") {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.translate(-height / 2, -width / 2);
      }

      // 배경
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-card")
        .trim() || "#36354D";
      ctx.fillRect(0, 0, effectiveW, effectiveH);

      // 테두리
      ctx.strokeStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--border-color")
          .trim() || "rgba(255,255,255,0.1)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, effectiveW - 2, effectiveH - 2);

      // 로고 이미지 (중앙 정렬된 위치)
      if (logoLoaded && logoImageRef.current) {
        const logoW = (logoImageRef.current.width / logoImageRef.current.height) * logoHeight;
        const logoX = (effectiveW - logoW) / 2;
        ctx.drawImage(logoImageRef.current, logoX, logoY, logoW, logoHeight);
      }

      // 제목
      ctx.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--text-primary")
          .trim() || "#FFFFFF";
      ctx.font = `700 ${fontSize.title}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(title, effectiveW / 2, L.titleY);

      // 부제목
      ctx.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--text-secondary")
          .trim() || "rgba(255,255,255,0.7)";
      ctx.font = `${fontSize.subtitle}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(subtitle, effectiveW / 2, L.subtitleY);

      // 게임하기 버튼 (Primary)
      const primaryButton = buttons.find((b) => b.isPrimary);
      if (primaryButton) {
        // 모바일에서도 충분한 크기 유지, Canvas 너비에 맞게 조정
        const availableWidth = effectiveW - L.padding * 2;
        const buttonW = Math.max(availableWidth * 0.6, Math.min(availableWidth * 0.8, 280));
        const buttonX = (effectiveW - buttonW) / 2;
        const buttonY = L.playButtonY;
        const buttonH = L.playButtonH;
        const radius = Math.max(10, Math.min(14, effectiveW * 0.035));

        // 그라데이션 배경
        const gradient = ctx.createLinearGradient(
          buttonX,
          buttonY,
          buttonX,
          buttonY + buttonH,
        );
        gradient.addColorStop(0, "#A78BFA");
        gradient.addColorStop(1, "#EC4899");
        ctx.fillStyle = gradient;
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(buttonX, buttonY, buttonW, buttonH, radius);
        } else {
          ctx.beginPath();
          ctx.moveTo(buttonX + radius, buttonY);
          ctx.lineTo(buttonX + buttonW - radius, buttonY);
          ctx.quadraticCurveTo(buttonX + buttonW, buttonY, buttonX + buttonW, buttonY + radius);
          ctx.lineTo(buttonX + buttonW, buttonY + buttonH - radius);
          ctx.quadraticCurveTo(buttonX + buttonW, buttonY + buttonH, buttonX + buttonW - radius, buttonY + buttonH);
          ctx.lineTo(buttonX + radius, buttonY + buttonH);
          ctx.quadraticCurveTo(buttonX, buttonY + buttonH, buttonX, buttonY + buttonH - radius);
          ctx.lineTo(buttonX, buttonY + radius);
          ctx.quadraticCurveTo(buttonX, buttonY, buttonX + radius, buttonY);
          ctx.closePath();
        }
        ctx.fill();

        // 텍스트
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 ${fontSize.playButton}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(primaryButton.label, buttonX + buttonW / 2, buttonY + buttonH / 2);
      }

      // 링크 버튼들
      const linkButtons = buttons.filter((b) => !b.isPrimary);
      if (linkButtons.length > 0) {
        // 각 버튼의 실제 너비 계산 (Canvas 너비에 맞게 조정)
        const buttonWidths: number[] = [];
        const availableWidth = effectiveW - L.padding * 2;
        const maxButtonWidth = Math.min(availableWidth / linkButtons.length - L.linkButtonGap, effectiveW * 0.2);
        
        linkButtons.forEach((button) => {
          const textWidth = fontSize.linkButton * button.label.length * 0.6;
          const minWidth = Math.max(60, textWidth + 16);
          const w = Math.min(Math.max(minWidth, maxButtonWidth), maxButtonWidth);
          buttonWidths.push(w);
        });
        
        const totalButtonWidth = buttonWidths.reduce((sum, w, i) => {
          return sum + w + (i > 0 ? L.linkButtonGap : 0);
        }, 0);
        
        // Canvas 중앙 정렬, 너비 초과 시 간격 조정
        let currentX = (effectiveW - totalButtonWidth) / 2;
        let adjustedGap = L.linkButtonGap;
        if (currentX < L.padding) {
          // 너비가 초과하면 간격을 줄임
          const overflow = L.padding - currentX;
          const gapReduction = overflow / (linkButtons.length - 1);
          adjustedGap = Math.max(4, L.linkButtonGap - gapReduction);
          const recalculatedTotalWidth = buttonWidths.reduce((sum, w, i) => {
            return sum + w + (i > 0 ? adjustedGap : 0);
          }, 0);
          currentX = (effectiveW - recalculatedTotalWidth) / 2;
        }

        linkButtons.forEach((button, index) => {
          const buttonW = buttonWidths[index];
          const buttonY = L.linksY;
          const buttonH = L.linkButtonH;
          const radius = Math.max(8, Math.min(10, width * 0.025));

          // 배경
          const bgColor = button.isDownload
            ? getComputedStyle(document.documentElement)
                .getPropertyValue("--bg-glass")
                .trim() || "rgba(255,255,255,0.1)"
            : getComputedStyle(document.documentElement)
                .getPropertyValue("--bg-glass")
                .trim() || "rgba(255,255,255,0.1)";
          ctx.fillStyle = bgColor;
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(currentX, buttonY, buttonW, buttonH, radius);
          } else {
            ctx.beginPath();
            ctx.moveTo(currentX + radius, buttonY);
            ctx.lineTo(currentX + buttonW - radius, buttonY);
            ctx.quadraticCurveTo(currentX + buttonW, buttonY, currentX + buttonW, buttonY + radius);
            ctx.lineTo(currentX + buttonW, buttonY + buttonH - radius);
            ctx.quadraticCurveTo(currentX + buttonW, buttonY + buttonH, currentX + buttonW - radius, buttonY + buttonH);
            ctx.lineTo(currentX + radius, buttonY + buttonH);
            ctx.quadraticCurveTo(currentX, buttonY + buttonH, currentX, buttonY + buttonH - radius);
            ctx.lineTo(currentX, buttonY + radius);
            ctx.quadraticCurveTo(currentX, buttonY, currentX + radius, buttonY);
            ctx.closePath();
          }
          ctx.fill();

          // 테두리
          ctx.strokeStyle = button.isDownload
            ? getComputedStyle(document.documentElement)
                .getPropertyValue("--accent-primary")
                .trim() || "#A78BFA"
            : getComputedStyle(document.documentElement)
                .getPropertyValue("--border-color")
                .trim() || "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // 텍스트
          ctx.fillStyle = button.isDownload
            ? getComputedStyle(document.documentElement)
                .getPropertyValue("--accent-primary")
                .trim() || "#A78BFA"
            : getComputedStyle(document.documentElement)
                .getPropertyValue("--text-primary")
                .trim() || "#FFFFFF";
          ctx.font = `${fontSize.linkButton}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(button.label, currentX + buttonW / 2, buttonY + buttonH / 2);

          currentX += buttonW + (index < linkButtons.length - 1 ? adjustedGap : 0);
        });
      }
      
      if (orientation === "portrait") {
        ctx.restore();
      }
    },
    [logoLoaded, title, subtitle, buttons, orientation],
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      // CSS aspect-ratio가 적용된 컨테이너의 실제 크기 사용
      const cw = Math.max(container.clientWidth || 0, MIN_WIDTH);
      const ch = Math.max(container.clientHeight || 0, minHeight);

      // 선택된 비율 강제 유지
      const maxW = Math.min(cw, MAX_WIDTH);
      const idealH = maxW / aspectRatio;
      let w = maxW;
      let h = idealH;

      // 높이가 제한되면 너비를 비율에 맞춤
      if (ch < idealH) {
        h = ch;
        w = h * aspectRatio;
        // 너비가 컨테이너를 넘지 않도록
        if (w > cw) {
          w = cw;
          h = w / aspectRatio;
        }
      }

      w = Math.max(MIN_WIDTH, Math.floor(w));
      h = Math.max(minHeight, Math.floor(h));
      setSize({ w, h });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [aspectRatio, minHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const baseDpr = window.devicePixelRatio || 1;
    const dpr = baseDpr;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false,
    });
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    calculateLayout(size.w, size.h);
    draw(ctx, size.w, size.h);
  }, [size, calculateLayout, draw]);

  // 클릭 처리
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!layoutRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let px = e.clientX - rect.left;
      let py = e.clientY - rect.top;

      const L = layoutRef.current;
      if (!L) return;
      const { padding, fontSize } = L;
      
      // 세로 모드일 때는 좌표 변환 (Canvas가 90도 회전되어 있음)
      let effectivePx = px;
      let effectivePy = py;
      if (orientation === "portrait") {
        const W = parseInt(canvas.style.width || "0", 10);
        const H = parseInt(canvas.style.height || "0", 10);
        if (W && H) {
          effectivePx = py;
          effectivePy = W - px;
        }
      }

      // Primary 버튼 클릭 체크
      const primaryButton = buttons.find((b) => b.isPrimary);
      if (primaryButton) {
        const availableWidth = L.width - padding * 2;
        const buttonW = Math.max(availableWidth * 0.6, Math.min(availableWidth * 0.8, 280));
        const buttonX = (L.width - buttonW) / 2;
        const buttonY = L.playButtonY;
        if (
          effectivePx >= buttonX &&
          effectivePx <= buttonX + buttonW &&
          effectivePy >= buttonY &&
          effectivePy <= buttonY + L.playButtonH
        ) {
          onButtonClick(primaryButton.id);
          return;
        }
      }

      // 링크 버튼 클릭 체크 (draw 함수와 동일한 계산)
      const linkButtons = buttons.filter((b) => !b.isPrimary);
      if (linkButtons.length > 0) {
        const availableWidth = L.width - padding * 2;
        const maxButtonWidth = Math.min(availableWidth / linkButtons.length - L.linkButtonGap, L.width * 0.2);
        const buttonWidths: number[] = [];
        
        linkButtons.forEach((button) => {
          const textWidth = fontSize.linkButton * button.label.length * 0.6;
          const minWidth = Math.max(60, textWidth + 16);
          const w = Math.min(Math.max(minWidth, maxButtonWidth), maxButtonWidth);
          buttonWidths.push(w);
        });
        
        const totalButtonWidth = buttonWidths.reduce((sum, w, i) => {
          return sum + w + (i > 0 ? L.linkButtonGap : 0);
        }, 0);
        let currentX = (L.width - totalButtonWidth) / 2;
        
        // 너비 초과 시 간격 조정 (draw 함수와 동일)
        if (currentX < padding) {
          const overflow = padding - currentX;
          const gapReduction = overflow / (linkButtons.length - 1);
          const adjustedGap = Math.max(4, L.linkButtonGap - gapReduction);
          const recalculatedTotalWidth = buttonWidths.reduce((sum, w, i) => {
            return sum + w + (i > 0 ? adjustedGap : 0);
          }, 0);
          currentX = (L.width - recalculatedTotalWidth) / 2;
          
          // 조정된 간격으로 버튼 위치 재계산
          for (let i = 0; i < linkButtons.length; i++) {
            const button = linkButtons[i];
            const buttonW = buttonWidths[i];
            const buttonY = L.linksY;
            if (
              effectivePx >= currentX &&
              effectivePx <= currentX + buttonW &&
              effectivePy >= buttonY &&
              effectivePy <= buttonY + L.linkButtonH
            ) {
              onButtonClick(button.id);
              return;
            }
            currentX += buttonW + (i < linkButtons.length - 1 ? adjustedGap : 0);
          }
        } else {
          // 정상적인 경우
          for (let i = 0; i < linkButtons.length; i++) {
            const button = linkButtons[i];
            const buttonW = buttonWidths[i];
            const buttonY = L.linksY;
            if (
              effectivePx >= currentX &&
              effectivePx <= currentX + buttonW &&
              effectivePy >= buttonY &&
              effectivePy <= buttonY + L.linkButtonH
            ) {
              onButtonClick(button.id);
              return;
            }
            currentX += buttonW + L.linkButtonGap;
          }
        }
      }
    },
    [buttons, onButtonClick, orientation],
  );

  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(
    null,
  );
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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
        const canvas = canvasRef.current;
        if (!canvas || !layoutRef.current) return;
        const rect = canvas.getBoundingClientRect();
        let px = e.changedTouches[0].clientX - rect.left;
        let py = e.changedTouches[0].clientY - rect.top;

        const L = layoutRef.current;
        const { padding, fontSize } = L;
        
        // 세로 모드일 때는 좌표 변환 (Canvas가 90도 회전되어 있음)
        let effectivePx = px;
        let effectivePy = py;
        if (orientation === "portrait") {
          const W = parseInt(canvas.style.width || "0", 10);
          const H = parseInt(canvas.style.height || "0", 10);
          if (W && H) {
            effectivePx = py;
            effectivePy = W - px;
          }
        }

        const primaryButton = buttons.find((b) => b.isPrimary);
        if (primaryButton) {
          const availableWidth = L.width - padding * 2;
          const buttonW = Math.max(availableWidth * 0.6, Math.min(availableWidth * 0.8, 280));
          const buttonX = (L.width - buttonW) / 2;
          const buttonY = L.playButtonY;
          if (
            effectivePx >= buttonX &&
            effectivePx <= buttonX + buttonW &&
            effectivePy >= buttonY &&
            effectivePy <= buttonY + L.playButtonH
          ) {
            onButtonClick(primaryButton.id);
            return;
          }
        }

        const linkButtons = buttons.filter((b) => !b.isPrimary);
        if (linkButtons.length > 0) {
          const availableWidth = L.width - padding * 2;
          const maxButtonWidth = Math.min(availableWidth / linkButtons.length - L.linkButtonGap, L.width * 0.2);
          const buttonWidths: number[] = [];
          
          linkButtons.forEach((button) => {
            const textWidth = fontSize.linkButton * button.label.length * 0.6;
            const minWidth = Math.max(60, textWidth + 16);
            const w = Math.min(Math.max(minWidth, maxButtonWidth), maxButtonWidth);
            buttonWidths.push(w);
          });
          
          const totalButtonWidth = buttonWidths.reduce((sum, w, i) => {
            return sum + w + (i > 0 ? L.linkButtonGap : 0);
          }, 0);
          let currentX = (L.width - totalButtonWidth) / 2;
          
          if (currentX < padding) {
            const overflow = padding - currentX;
            const gapReduction = overflow / (linkButtons.length - 1);
            const adjustedGap = Math.max(4, L.linkButtonGap - gapReduction);
            const recalculatedTotalWidth = buttonWidths.reduce((sum, w, i) => {
              return sum + w + (i > 0 ? adjustedGap : 0);
            }, 0);
            currentX = (L.width - recalculatedTotalWidth) / 2;
            
            for (let i = 0; i < linkButtons.length; i++) {
              const button = linkButtons[i];
              const buttonW = buttonWidths[i];
              const buttonY = L.linksY;
              if (
                effectivePx >= currentX &&
                effectivePx <= currentX + buttonW &&
                effectivePy >= buttonY &&
                effectivePy <= buttonY + L.linkButtonH
              ) {
                onButtonClick(button.id);
                return;
              }
              currentX += buttonW + (i < linkButtons.length - 1 ? adjustedGap : 0);
            }
          } else {
            for (let i = 0; i < linkButtons.length; i++) {
              const button = linkButtons[i];
              const buttonW = buttonWidths[i];
              const buttonY = L.linksY;
              if (
                effectivePx >= currentX &&
                effectivePx <= currentX + buttonW &&
                effectivePy >= buttonY &&
                effectivePy <= buttonY + L.linkButtonH
              ) {
                onButtonClick(button.id);
                return;
              }
              currentX += buttonW + L.linkButtonGap;
            }
          }
        }
      }
    },
    [buttons, onButtonClick, orientation],
  );

  return (
    <div
      ref={containerRef}
      className="game-canvas-wrapper"
      data-orientation={orientation}
    >
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="메뉴"
      />
    </div>
  );
};

export default memo(MenuCanvas);
