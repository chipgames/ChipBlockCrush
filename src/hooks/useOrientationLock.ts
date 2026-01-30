import { useState, useCallback, useEffect, useRef } from "react";

type LockType = "landscape" | "portrait" | null;

interface OrientationLockState {
  supported: boolean;
  locked: boolean;
  lockType: LockType;
  error: string | null;
}

const ORIENTATION_STORAGE_KEY = "chipBlockCrush_orientationLock";

function setStoredPreference(value: LockType) {
  try {
    if (value) localStorage.setItem(ORIENTATION_STORAGE_KEY, value);
    else localStorage.removeItem(ORIENTATION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useOrientationLock() {
  const [state, setState] = useState<OrientationLockState>(() => {
    const orient =
      typeof screen !== "undefined" &&
      (screen.orientation as
        | { lock?: (t: string) => Promise<void>; unlock?: () => void }
        | undefined);
    const supported = !!(
      orient &&
      typeof orient?.lock === "function" &&
      typeof orient?.unlock === "function"
    );
    return {
      supported,
      locked: false,
      lockType: null,
      error: null,
    };
  });

  const lockedRef = useRef<LockType>(null);

  useEffect(() => {
    if (!state.supported) return;
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        lockedRef.current = null;
        setState((s) => ({ ...s, locked: false, lockType: null }));
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [state.supported]);

  const lock = useCallback(
    async (type: "landscape" | "portrait") => {
      if (!state.supported) {
        setState((s) => ({ ...s, error: "Not supported" }));
        return;
      }
      setState((s) => ({ ...s, error: null }));
      try {
        const doc = document.documentElement;
        if (!document.fullscreenElement && doc.requestFullscreen) {
          await doc.requestFullscreen();
        }
        const lockOrientation =
          type === "landscape" ? "landscape-primary" : "portrait-primary";
        const orient = screen.orientation as unknown as {
          lock: (t: string) => Promise<void>;
          unlock: () => void;
        };
        await orient.lock(lockOrientation);
        setStoredPreference(type);
        lockedRef.current = type;
        setState((s) => ({ ...s, locked: true, lockType: type, error: null }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lock failed";
        setState((s) => ({
          ...s,
          locked: false,
          lockType: null,
          error: message,
        }));
      }
    },
    [state.supported],
  );

  const unlock = useCallback(async () => {
    if (!state.supported) return;
    try {
      screen.orientation.unlock();
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setStoredPreference(null);
      lockedRef.current = null;
      setState((s) => ({
        ...s,
        locked: false,
        lockType: null,
        error: null,
      }));
    } catch {
      lockedRef.current = null;
      setState((s) => ({
        ...s,
        locked: false,
        lockType: null,
      }));
    }
  }, [state.supported]);

  const toggleLock = useCallback(
    (prefer: "landscape" | "portrait") => {
      if (state.locked && state.lockType === prefer) {
        unlock();
      } else {
        lock(prefer);
      }
    },
    [state.locked, state.lockType, lock, unlock],
  );

  return {
    ...state,
    lock,
    unlock,
    toggleLock,
  };
}
