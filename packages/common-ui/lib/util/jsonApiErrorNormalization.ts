/**
 * Normalizes a JSON:API error source pointer to a clean field name
 * that matches Formik field names.
 *
 * e.g. "/data/attributes/materialSampleName" → "materialSampleName"
 * e.g. "/data/relationships/collection"    → "collection"
 */
export function normalizeJsonApiPointer(pointer: string): string {
  return pointer
    .replace(/^\/?data\/attributes\//, "")
    .replace(/^\/?data\/relationships\//, "");
}

/**
 * Formats a JSON:API error into a human-readable message.
 * Uses "title: detail" format when both are available.
 */
export function formatJsonApiErrorMessage(
  title?: string,
  detail?: string
): string {
  return (
    [title, detail].filter((s) => s?.trim()).join(": ") || detail || title || ""
  );
}
