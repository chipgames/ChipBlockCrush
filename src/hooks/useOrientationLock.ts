import { useState, useEffect, useCallback } from "react";

export type OrientationLockType = "portrait" | "landscape" | null;

/** Screen Orientation API lock/unlock (DOM 타입과 호환용) */
type OrientWithLock = {
  lock?(orientation: string): Promise<void>;
  unlock?(): Promise<void>;
};

const getOrientation = (): OrientWithLock | null =>
  typeof screen !== "undefined" && "orientation" in screen
    ? (screen.orientation as unknown as OrientWithLock)
    : null;

const isSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  const orient = getOrientation();
  return (
    orient != null && orient.lock != null && typeof orient.lock === "function"
  );
};

const getCurrentOrientation = (): OrientationLockType => {
  if (typeof window === "undefined") return null;
  const angle = window.orientation ?? screen.orientation?.angle ?? 0;
  return Math.abs(angle) === 90 ? "landscape" : "portrait";
};

export const useOrientationLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockType, setLockType] = useState<OrientationLockType>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isSupported());
    if (supported) {
      const current = getCurrentOrientation();
      setLockType(current);
    }
  }, [supported]);

  useEffect(() => {
    if (!supported) return;

    const handleChange = () => {
      const current = getCurrentOrientation();
      setLockType(current);
    };

    window.addEventListener("orientationchange", handleChange);
    screen.orientation?.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("orientationchange", handleChange);
      screen.orientation?.removeEventListener("change", handleChange);
    };
  }, [supported]);

  const lock = useCallback(
    async (
      type: "portrait" | "landscape",
      options?: { skipFullscreen?: boolean }
    ): Promise<boolean> => {
      if (!supported) return false;
      try {
        const orient = getOrientation();
        if (orient?.lock) {
          // 사용자 제스처 없이 호출될 때는 풀스크린 생략 (PWA 초기·화면 복귀 시)
          const skipFs = options?.skipFullscreen === true;
          if (!skipFs) {
            try {
              if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
              }
            } catch (fsErr) {
              console.warn("Fullscreen request failed, continuing:", fsErr);
            }
          }

          // lock 타입: "-primary" 접미사 사용
          const lockType = type === "landscape" ? "landscape-primary" : "portrait-primary";
          
          try {
            await orient.lock(lockType);
          } catch (err) {
            // "-primary" 실패 시 기본 타입 시도
            try {
              await orient.lock(type);
            } catch (err2) {
              // 기본 타입도 실패 시 "any" 시도
              try {
                await orient.lock("any");
              } catch (err3) {
                throw err; // 원래 에러 throw
              }
            }
          }
        }
        setIsLocked(true);
        setLockType(type);
        return true;
      } catch (err) {
        // iOS Safari 등에서는 lock이 작동하지 않을 수 있음
        console.warn("Failed to lock orientation:", err);
        return false;
      }
    },
    [supported]
  );

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    try {
      const orient = getOrientation();
      if (orient?.unlock) {
        await orient.unlock();
      }
      // 전체 화면 모드 해제
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (fsErr) {
          // 전체 화면 해제 실패는 무시
        }
      }
      setIsLocked(false);
      setLockType(getCurrentOrientation());
      return true;
    } catch (err) {
      console.warn("Failed to unlock orientation:", err);
      return false;
    }
  }, [supported]);

  const toggle = useCallback(
    async (preferredType?: "portrait" | "landscape"): Promise<boolean> => {
      if (isLocked) {
        return await unlock();
      } else {
        const targetType =
          preferredType ?? (lockType === "portrait" ? "landscape" : "portrait");
        return await lock(targetType);
      }
    },
    [isLocked, lockType, lock, unlock]
  );

  return {
    supported,
    isLocked,
    lockType,
    lock,
    unlock,
    toggle,
  };
};
