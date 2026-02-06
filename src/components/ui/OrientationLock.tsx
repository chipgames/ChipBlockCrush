import React from "react";
import { useCanvasOrientation } from "@/contexts/CanvasOrientationContext";
import "./OrientationLock.css";

interface OrientationLockProps {
  className?: string;
}

const OrientationLock: React.FC<OrientationLockProps> = ({ className }) => {
  const { orientation, toggleOrientation } = useCanvasOrientation();
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });

  React.useEffect(() => {
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

  if (!isMobile) return null;

  const getIcon = () => {
    return orientation === "landscape" ? "🖥️" : "📱";
  };

  const getLabel = () => {
    return orientation === "landscape" ? "가로" : "세로";
  };

  const handleClick = () => {
    toggleOrientation();
    // Canvas 리사이즈를 위해 약간의 지연 후 resize 이벤트 트리거
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  };

  return (
    <button
      type="button"
      className={`orientation-lock-button ${className ?? ""}`}
      onClick={handleClick}
      aria-label={`Canvas ${getLabel()} 모드`}
      title={`Canvas ${getLabel()} 모드`}
    >
      <span className="orientation-lock-icon">{getIcon()}</span>
      <span className="orientation-lock-label">{getLabel()}</span>
    </button>
  );
};

export default OrientationLock;
