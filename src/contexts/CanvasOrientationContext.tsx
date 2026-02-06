import React, { createContext, useContext, useState, useEffect } from "react";

type CanvasOrientation = "landscape" | "portrait";

interface CanvasOrientationContextType {
  orientation: CanvasOrientation;
  toggleOrientation: () => void;
  setOrientation: (orientation: CanvasOrientation) => void;
}

const CanvasOrientationContext = createContext<
  CanvasOrientationContextType | undefined
>(undefined);

const STORAGE_KEY = "chipBlockCrush_canvasOrientation";

export const CanvasOrientationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [orientation, setOrientationState] = useState<CanvasOrientation>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "portrait" || saved === "landscape") {
        return saved;
      }
    }
    return "landscape"; // 기본값: 가로 (16:9)
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, orientation);
  }, [orientation]);

  const setOrientation = (newOrientation: CanvasOrientation) => {
    setOrientationState(newOrientation);
  };

  const toggleOrientation = () => {
    setOrientationState((prev) =>
      prev === "landscape" ? "portrait" : "landscape"
    );
  };

  return (
    <CanvasOrientationContext.Provider
      value={{ orientation, toggleOrientation, setOrientation }}
    >
      {children}
    </CanvasOrientationContext.Provider>
  );
};

export const useCanvasOrientation = () => {
  const context = useContext(CanvasOrientationContext);
  if (!context) {
    throw new Error(
      "useCanvasOrientation must be used within CanvasOrientationProvider"
    );
  }
  return context;
};
