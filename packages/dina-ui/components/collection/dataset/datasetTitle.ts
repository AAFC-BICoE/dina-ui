import { getPreferredMultilingualPair } from "common-ui";
import { Dataset } from "../../../types/collection-api";

/**
 * Dataset has no "name" field, so the title stands in for it on the view page
 * heading and in the list page's link column.
 * Falls back from the multilingual title to the export name, then the UUID.
 */
export function getDatasetTitle(
  dataset?: Partial<Dataset> | null,
  locale?: string
): string {
  return (
    getPreferredMultilingualPair(
      dataset?.multilingualTitle?.titles,
      "title",
      locale
    )?.title ||
    dataset?.exportName ||
    dataset?.id ||
    ""
  );
}
