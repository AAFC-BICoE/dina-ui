import { Dataset } from "../../../types/collection-api";

/**
 * Dataset has no "name" field, so the multilingual title stands in for it on the
 * view page heading and in the list page's link column. Prefers the given
 * locale, then falls back to the first non-blank title.
 */
export function getDatasetTitle(
  dataset?: Partial<Dataset> | null,
  locale?: string
): string {
  const titles = (dataset?.multilingualTitle?.titles ?? []).filter(
    (pair) => !!pair?.title
  );

  return (
    titles.find((pair) => pair?.lang === locale)?.title ??
    titles[0]?.title ??
    ""
  );
}
