import { logger } from "./logger";

const STORAGE_PREFIX = "chipBlockCrush_";

interface StorageOptions {
  fallback?: unknown;
  silent?: boolean;
}

export const storageManager = {
  get<T>(key: string, options: StorageOptions = {}): T | null {
    const fullKey = STORAGE_PREFIX + key;
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return (options.fallback as T) ?? null;
      return JSON.parse(raw) as T;
    } catch (e) {
      if (!options.silent) logger.warn("storage get failed", fullKey, e);
      return (options.fallback as T) ?? null;
    }
  },

  set(key: string, value: unknown, options: { silent?: boolean } = {}): void {
    const fullKey = STORAGE_PREFIX + key;
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (e) {
      if (!options.silent) logger.warn("storage set failed", fullKey, e);
    }
  },
};
