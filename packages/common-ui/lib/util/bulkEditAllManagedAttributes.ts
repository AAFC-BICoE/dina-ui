/**
 * Bulk managed–attribute bulk updater.
 *
 * This method is used for determining what fields need to be send in the PATCH/POST request.
 *
 * @param editAll       – Edit-all tab form values coming from the bulk editor.
 * @param sample        – The current sample object that is being prepared for save.
 * @param deleteFields  – Keys that must be removed from the result entirely.
 * @param fieldName     – Top-level property to operate on (default: "managedAttributes").
 *
 * Rules implemented:
 * 1.  deleteAll  → remove managed attribute completely
 * 2.  editAll    → non-empty value overrides; empty value keeps the sample’s value (if any).
 * 3.  Anything left on the sample is kept as-is.
 */
export function bulkEditAllManagedAttributes(
  editAll: Record<string, any>,
  sample: Record<string, any>,
  deletedFields: Set<string>,
  fieldName = "managedAttributes"
): Record<string, any> {
  const prefix = `${fieldName}.`;

  const deleteAll: string[] = Array.from(deletedFields)
    .filter((f) => f.startsWith(prefix))
    .map((f) => f.slice(prefix.length));

  // The end network request to be made.
  const result: Record<string, any> = {};

  // Create a set of all the unique possible keys.
  const keys = new Set<string>([
    ...Object.keys(sample || {}),
    ...Object.keys(editAll || {}),
    ...deleteAll
  ]);

  keys.forEach((key) => {
    if (deleteAll.includes(key)) {
      // Do NOT add this key to the end result.
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
