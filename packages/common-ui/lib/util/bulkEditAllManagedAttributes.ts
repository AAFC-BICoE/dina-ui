/**
 * Bulk managed–attribute bulk updater.
 *
 * @param editAll   – Edit-all tab form values coming from the bulk editor.
 * @param sample    – The current sample object that is being prepared for save.
 * @param clearAll  – Keys that must be hard-cleared (set to the empty string "").
 * @param deleteAll – Keys that must be removed from the result entirely.
 *
 * Rules implemented:
 * 1.  deleteAll  → remove managed attribute completely
 * 2.  clearAll   → set managed attribute to the empty string "".
 * 3.  editAll    → non-empty value overrides; empty value keeps the sample’s value (if any).
 * 4.  Anything left on the sample is kept as-is.
 */
export function bulkEditAllManagedAttributes(
  editAll: Record<string, any>,
  sample: Record<string, any>,
  clearAll: string[] = [],
  deleteAll: string[] = []
): Record<string, any> {
  // The end network request to be made.
  const result: Record<string, any> = {};

  // Create a set of all the unique possible keys.
  const keys = new Set<string>([
    ...Object.keys(sample || {}),
    ...Object.keys(editAll || {}),
    ...clearAll,
    ...deleteAll
  ]);

  keys.forEach((key) => {
    if (deleteAll.includes(key)) {
      // Do NOT add this key to the end result.
      return;
    }

    // If in the clearAll array, then it should be set to empty.
    if (clearAll.includes(key)) {
      result[key] = "";
      return;
    }

    if (Object.prototype.hasOwnProperty.call(editAll, key)) {
      const editValue = editAll[key];

      // Non-empty editAll, then it should be overrided on each sample.
      if (editValue !== "") {
        result[key] = editValue;
      }
      // Empty editAll means keep unchanged, keep existing value if there is one.
      else if (key in sample) {
        result[key] = sample[key];
      }
      return;
    }

    // Leave untouched keys.
    if (key in sample) {
      result[key] = sample[key];
    }
  });

  return result;
}
