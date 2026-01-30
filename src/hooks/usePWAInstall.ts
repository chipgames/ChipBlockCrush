import { useState, useEffect } from "react";

/** Chrome/Edge 등에서 PWA 설치 프롬프트 시 전달되는 이벤트 타입 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAInstallState {
  /** beforeinstallprompt가 발생했고 아직 설치되지 않음 → 설치 버튼 노출 */
  canInstall: boolean;
  /** iOS Safari 등 (프로그래밍 방식 설치 불가, 안내만 가능) */
  isIOS: boolean;
  /** 이미 standalone(앱처럼) 실행 중 */
  isStandalone: boolean;
  /** 설치 버튼을 눌렀을 때 호출. Android/Chrome에서는 prompt 표시, iOS에서는 무시(안내는 UI에서) */
  promptInstall: () => Promise<void>;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const canInstall = Boolean(deferredPrompt) && !isStandalone;

  return { canInstall, isIOS, isStandalone, promptInstall };
}
