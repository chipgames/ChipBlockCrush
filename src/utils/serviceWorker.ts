export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const base =
    typeof import.meta.env?.BASE_URL === "string"
      ? import.meta.env.BASE_URL
      : "/ChipBlockCrush/";
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {});
  });
}
