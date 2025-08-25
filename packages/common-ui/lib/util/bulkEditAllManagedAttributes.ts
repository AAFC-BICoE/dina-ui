/**
 * Bulk managed–attribute bulk updater.
 *
 * @param editAll   – Edit-all tab form values coming from the bulk editor.
 * @param sample    – The current sample object that is being prepared for save.
 * @param clearAll  – Keys that must be hard-cleared (set to the empty string "").
 *
 * Rules implemented:
 *
 * 1.  Edit-all changes have priority over the original sample.
 * 2.  If an edit-all value is "", leave it untouched, if the sample has the key. Otherwise omit the key.
 * 3.  Keys existing on the sample but not present in editAll must be deleted (set to null).
 * 4.  Any key contained in clearAll is **always** set to "".
 */
export function bulkEditAllManagedAttributes(
  editAll: Record<string, any>,
  sample: Record<string, any>,
  clearAll: string[] = []
): Record<string, any> {
  // The end network request to be made.
  const result: Record<string, any> = {};

  // Create a set of all the unique possible keys.
  const keys = new Set<string>([
    ...Object.keys(sample),
    ...Object.keys(editAll),
    ...clearAll
  ]);

  keys.forEach((key) => {
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

    // If managed attribute key is absent from editAll but present on sample then it should be
    // deleted. (Set to null)
    if (key in sample) {
      result[key] = null;
    }
  });

  return result;
}
