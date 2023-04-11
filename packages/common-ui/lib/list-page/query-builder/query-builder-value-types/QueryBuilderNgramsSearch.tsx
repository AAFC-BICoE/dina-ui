import { useIntl } from "react-intl";

interface QueryBuilderNgramsSearchProps {
  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

export default function QueryBuilderNgramsSearch({
  matchType,
  value,
  setValue
}: QueryBuilderNgramsSearchProps) {
  const { formatMessage } = useIntl();

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {(matchType === "equals" ||
        matchType === "exactMatch" ||
        matchType === "prefix" ||
        matchType === "infix" ||
        matchType === "suffix" ||
        matchType === "notEquals") && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(newValue) => setValue?.(newValue?.target?.value)}
          className="form-control"
          placeholder={formatMessage({
            id: "queryBuilder_value_text_placeholder"
          })}
        />
      )}
    </>
  );
}
