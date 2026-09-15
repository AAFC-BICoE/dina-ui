import { getPreferredMultilingualPair } from "common-ui";
import { Dataset } from "../../../types/collection-api";

/**
 * Dataset has no "name" field, so the multilingual title stands in for it on the
 * view page heading and in the list page's link column.
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
    )?.title ?? ""
  );
}
