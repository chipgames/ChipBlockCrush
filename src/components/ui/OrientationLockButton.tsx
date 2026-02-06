import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useOrientationLock } from "@/hooks/useOrientationLock";
import "./OrientationLockButton.css";

const OrientationLockButton: React.FC = () => {
  const { t } = useLanguage();
  const { supported, isLocked, lockType, unlock, toggle } =
    useOrientationLock();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  if (!supported) return null;

  return (
    <div className="orientation-lock-wrap" ref={menuRef}>
      <button
        type="button"
        className="orientation-lock-btn"
        onClick={() => setOpen((v) => !v)}
        title={
          isLocked ? t("header.orientationUnlock") : t("header.orientationLock")
        }
        aria-label={
          isLocked ? t("header.orientationUnlock") : t("header.orientationLock")
        }
        aria-expanded={open}
      >
        <span className="orientation-lock-icon" aria-hidden>
          {isLocked ? (lockType === "landscape" ? "↔" : "↕") : "⤢"}
        </span>
      </button>
      {open && (
        <div className="orientation-lock-menu">
          <button
            type="button"
            className={lockType === "landscape" ? "active" : ""}
            onClick={() => {
              toggle("landscape");
              setOpen(false);
            }}
          >
            {t("header.orientationLandscape")}
          </button>
          <button
            type="button"
            className={lockType === "portrait" ? "active" : ""}
            onClick={() => {
              toggle("portrait");
              setOpen(false);
            }}
          >
            {t("header.orientationPortrait")}
          </button>
          {isLocked && (
            <button
              type="button"
              className="orientation-lock-unlock"
              onClick={() => {
                unlock();
                setOpen(false);
              }}
            >
              {t("header.orientationUnlock")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrientationLockButton;
