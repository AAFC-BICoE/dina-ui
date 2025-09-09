import { ClearType } from "../bulk-edit/bulk-context";

/**
 * Bulk managed–attribute bulk updater.
 *
 * This method is used for determining what fields need to be send in the PATCH/POST request.
 *
 * @param editAll       – Edit-all tab form values coming from the bulk editor.
 * @param sample        – The current sample object that is being prepared for save.
 * @param clearFields   – Map of field names to their clear types.
 * @param deleteFields  – Keys that must be removed from the result entirely.
 * @param fieldName     – Top-level property to operate on (default: "managedAttributes").
 *
 * Rules implemented:
 * 1.  deleteAll  → remove managed attribute completely
 * 2.  clearAll   → set managed attribute based on ClearType (empty string or null).
 * 3.  editAll    → non-empty value overrides; empty value keeps the sample’s value (if any).
 * 4.  Anything left on the sample is kept as-is.
 */
export function bulkEditAllManagedAttributes(
  editAll: Record<string, any>,
  sample: Record<string, any>,
  clearedFields: Map<string, ClearType>,
  deletedFields: Set<string>,
  fieldName = "managedAttributes"
): Record<string, any> {
  const prefix = `${fieldName}.`;

  // Extract cleared fields that match the prefix and create a map of key -> clear value
  const clearAll = new Map<string, any>();
  clearedFields.forEach((clearType, fieldPath) => {
    if (fieldPath.startsWith(prefix)) {
      const key = fieldPath.slice(prefix.length);
      const clearValue = clearType === ClearType.EmptyString ? "" : null;
      clearAll.set(key, clearValue);
    }
  });

  const deleteAll: string[] = Array.from(deletedFields)
    .filter((f) => f.startsWith(prefix))
    .map((f) => f.slice(prefix.length));

  // The end network request to be made.
  const result: Record<string, any> = {};

  // Create a set of all the unique possible keys.
  const keys = new Set<string>([
    ...Object.keys(sample || {}),
    ...Object.keys(editAll || {}),
    ...Array.from(clearAll.keys()),
    ...deleteAll
  ]);

  keys.forEach((key) => {
    if (deleteAll.includes(key)) {
      // Do NOT add this key to the end result.
      return;
    }

    // If in the clearAll map, then it should be set to empty.
    if (clearAll.has(key)) {
      result[key] = clearAll.get(key);
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
