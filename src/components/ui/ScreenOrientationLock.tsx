import React, { useState, useEffect } from "react";
import { useOrientationLock } from "@/hooks/useOrientationLock";
import "./ScreenOrientationLock.css";

interface ScreenOrientationLockProps {
  className?: string;
}

const STORAGE_KEY = "chipBlockCrush_screenOrientationLocked";

const ScreenOrientationLock: React.FC<ScreenOrientationLockProps> = ({
  className,
}) => {
  const { supported, lock, unlock } = useOrientationLock();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });
  const [isAutoLockEnabled, setIsAutoLockEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "true";
    }
    return true; // 기본값: 고정
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0
      );
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const applyLock = React.useCallback(
    async (opts?: { skipFullscreen?: boolean }) => {
      if (!supported || !isMobile) return;
      const currentOrientation =
        Math.abs(window.orientation ?? screen.orientation?.angle ?? 0) === 90
          ? "landscape"
          : "portrait";
      try {
        await lock(currentOrientation, opts);
      } catch (err) {
        console.warn("Failed to lock orientation:", err);
      }
    },
    [supported, isMobile, lock]
  );

  // 자동 고정 설정 변경 시
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isAutoLockEnabled));

    if (!supported || !isMobile) return;

    const run = async () => {
      if (isAutoLockEnabled) {
        await applyLock();
      } else {
        try {
          await unlock();
        } catch (err) {
          console.warn("Failed to unlock orientation:", err);
        }
      }
    };
    run();
  }, [isAutoLockEnabled, supported, isMobile, lock, unlock, applyLock]);

  // PWA/게임 접근 시 초기 고정: 여러 시점에 재시도 (API 준비·탭 활성화 타이밍 대응)
  const INITIAL_LOCK_DELAYS = [200, 600, 1200, 2500];
  useEffect(() => {
    if (!isMobile || !isAutoLockEnabled) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    INITIAL_LOCK_DELAYS.forEach((ms) => {
      const t = setTimeout(() => {
        if (!supported) return;
        applyLock({ skipFullscreen: true });
      }, ms);
      timeouts.push(t);
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [isMobile, isAutoLockEnabled, supported, applyLock]);

  // 앱이 다시 보일 때(화면 껐다 켜기·잠금 해제 후 복귀) 고정 재적용 — 재시도로 확실히 적용
  const RESUME_LOCK_DELAYS = [50, 300, 700, 1500];
  useEffect(() => {
    if (!supported || !isMobile || !isAutoLockEnabled) return;

    const scheduleReapply = () => {
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      RESUME_LOCK_DELAYS.forEach((ms) => {
        timeouts.push(setTimeout(() => applyLock({ skipFullscreen: true }), ms));
      });
      return () => timeouts.forEach((t) => clearTimeout(t));
    };

    let cancel: (() => void) | null = null;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      cancel?.();
      cancel = scheduleReapply();
    };

    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      cancel?.();
      cancel = scheduleReapply();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      cancel?.();
    };
  }, [supported, isMobile, isAutoLockEnabled, applyLock]);

  // 고정 활성화 시 방향 변경 감지하여 자동으로 다시 고정
  useEffect(() => {
    if (!supported || !isMobile || !isAutoLockEnabled) return;

    const run = () => {
      let cleared = false;
      const id = setTimeout(async () => {
        if (cleared) return;
        try {
          await applyLock({ skipFullscreen: true });
        } catch (err) {
          // 조용히 실패
        }
      }, 100);
      return () => {
        cleared = true;
        clearTimeout(id);
      };
    };

    let cleanup: (() => void) | undefined;
    const handler = () => {
      cleanup = run();
    };

    window.addEventListener("orientationchange", handler);
    if (screen.orientation) {
      screen.orientation.addEventListener("change", handler);
    }

    return () => {
      window.removeEventListener("orientationchange", handler);
      if (screen.orientation) {
        screen.orientation.removeEventListener("change", handler);
      }
      cleanup?.();
    };
  }, [supported, isMobile, isAutoLockEnabled, applyLock]);

  if (!supported || !isMobile) return null;

  const handleClick = async () => {
    const newValue = !isAutoLockEnabled;
    setIsAutoLockEnabled(newValue);
    
    // 즉시 lock/unlock 실행 (useEffect와 별도로)
    if (supported && isMobile) {
      if (newValue) {
        // 고정 활성화: 현재 방향으로 고정
        const currentOrientation =
          Math.abs(window.orientation ?? screen.orientation?.angle ?? 0) === 90
            ? "landscape"
            : "portrait";
        try {
          await lock(currentOrientation);
        } catch (err) {
          console.warn("Failed to lock orientation:", err);
        }
      } else {
        // 고정 해제
        try {
          await unlock();
        } catch (err) {
          console.warn("Failed to unlock orientation:", err);
        }
      }
    }
  };

  const getIcon = () => {
    return isAutoLockEnabled ? "🔒" : "🔄";
  };

  const getLabel = () => {
    return isAutoLockEnabled ? "고정" : "전환";
  };

  return (
    <button
      type="button"
      className={`screen-orientation-lock-button ${className ?? ""} ${
        isAutoLockEnabled ? "locked" : "unlocked"
      }`}
      onClick={handleClick}
      aria-label={isAutoLockEnabled ? "화면 방향 고정 해제" : "화면 방향 고정"}
      title={isAutoLockEnabled ? "화면 방향 고정 해제" : "화면 방향 고정"}
    >
      <span className="screen-orientation-lock-icon">{getIcon()}</span>
      <span className="screen-orientation-lock-label">{getLabel()}</span>
    </button>
  );
};

export default ScreenOrientationLock;
