
import { deepEqual } from "./deepEqual";

export interface DiffOptions {
  /** Keys to ignore entirely from diff generation (e.g., UI-only fields). */
  ignoreKeys?: string[];
  /** Map of transforms applied to edited value before comparison (e.g., trim). */
  customHandlers?: Record<string, (value: any) => any>;
}

export function pickChangedFields<T extends Record<string, any>>(
  original: T,
  edited: T,
  { ignoreKeys = [], customHandlers = {} }: DiffOptions = {}
): Partial<T> {
  const diff: Partial<T> = {};
  const ignoreSet = new Set(ignoreKeys);

  for (const key of Object.keys(edited)) {
    if (ignoreSet.has(key)) continue;
    const originalValue = original?.[key];
    let newValue = edited?.[key];

    if (customHandlers[key]) {
      newValue = customHandlers[key](newValue);
    }

    // treat undefined like "not present" to avoid noisy updates
    const isPresent = typeof newValue !== "undefined";
    if (!isPresent) continue;

    if (!deepEqual(originalValue, newValue)) {
      (diff as any)[key] = newValue;
    }
  }

  return diff;
}
