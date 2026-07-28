import { useIntl } from "react-intl";
import { DateView } from "./date/DateView";

export interface LastUpdatedOnProps {
  /** The lastUpdatedOn date string from the API. Renders nothing if null/undefined. */
  date?: string | null;
}

/**
 * Renders a "Last Updated" watermark in the bottom-right corner of a page.
 * Only renders when a non-null date is provided.
 */
export function LastUpdatedOn({ date }: LastUpdatedOnProps) {
  const { formatMessage } = useIntl();
  if (!date) {
    return null;
  }

  return (
    <div
      style={{
        textAlign: "right",
        fontSize: "0.8rem",
        color: "#6c757d",
        padding: "0.75rem 1rem 0 0"
      }}
    >
      <strong> {formatMessage({ id: "field_lastUpdatedOn" })}: </strong>{" "}
      <DateView date={date} />
    </div>
  );
}
