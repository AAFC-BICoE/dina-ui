import { escapeRegExp } from "lodash";

export interface HighlightedTextProps {
  /** The text to display. */
  text: string;

  /** The search term to highlight within the text (case-insensitive). */
  search?: string;
}

/**
 * Renders the text with every occurrence of the search term in bold.
 */
export function HighlightedText({ text, search }: HighlightedTextProps) {
  const term = search?.trim();
  if (!term) {
    return <>{text}</>;
  }

  // The capture group keeps the matched parts in the split result at the odd indexes:
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="resource-select-highlight">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}
