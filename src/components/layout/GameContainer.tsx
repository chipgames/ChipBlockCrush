import React from "react";
import "./GameContainer.css";

interface GameContainerProps {
  children: React.ReactNode;
  /** true면 콘텐츠를 상단부터 배치(가이드/도움말 등). false면 세로 가운데 정렬. */
  contentStartsAtTop?: boolean;
}

const GameContainer: React.FC<GameContainerProps> = ({
  children,
  contentStartsAtTop = false,
}) => {
  return (
    <div
      className={`game-container${contentStartsAtTop ? " content-top" : ""}`}
    >
      {children}
    </div>
  );
};

export default GameContainer;
