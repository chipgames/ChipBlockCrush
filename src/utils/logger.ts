export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env?.DEV) console.log("[ChipBlockCrush]", ...args);
  },
  info: (...args: unknown[]) => console.info("[ChipBlockCrush]", ...args),
  warn: (...args: unknown[]) => console.warn("[ChipBlockCrush]", ...args),
  error: (...args: unknown[]) => console.error("[ChipBlockCrush]", ...args),
};
