import { useIntl } from "react-intl";
import { TransformToDSLProps } from "../../types";

interface QueryRowGlobalSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

export default function QueryRowGlobalSearchSearch({
  value,
  setValue
}: QueryRowGlobalSearchProps) {
  const { formatMessage } = useIntl();

  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(newValue) => setValue?.(newValue?.target?.value)}
      className="form-control"
      placeholder={formatMessage({
        id: "queryBuilder_value_text_placeholder"
      })}
    />
  );
};

export function transformGlobalSearchToDSL({
  value
}: TransformToDSLProps): any {
  return {};
};