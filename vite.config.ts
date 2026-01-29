import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = packageJson.version;

export default defineConfig(({ command, mode }) => {
  const base =
    command === "serve" || mode === "development" ? "/" : "/ChipBlockCrush/";

  return {
    plugins: [react()],
    base,
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/components": path.resolve(__dirname, "./src/components"),
        "@/hooks": path.resolve(__dirname, "./src/hooks"),
        "@/services": path.resolve(__dirname, "./src/services"),
        "@/utils": path.resolve(__dirname, "./src/utils"),
        "@/types": path.resolve(__dirname, "./src/types"),
        "@/constants": path.resolve(__dirname, "./src/constants"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      minify: mode === "production" ? "esbuild" : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            helmet: ["react-helmet-async"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      target: "es2015",
    },
    server: {
      port: 3000,
      open: true,
      host: true,
    },
  };
});
