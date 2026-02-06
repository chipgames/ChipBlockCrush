import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { CanvasOrientationProvider } from "@/contexts/CanvasOrientationContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <CanvasOrientationProvider>
        <App />
      </CanvasOrientationProvider>
    </HelmetProvider>
  </React.StrictMode>
);
