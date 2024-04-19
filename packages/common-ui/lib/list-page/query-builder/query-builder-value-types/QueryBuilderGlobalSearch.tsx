import { useIntl } from "react-intl";
import { TransformToDSLProps } from "../../types";
import { useSessionStorage } from "usehooks-ts";
import { useEffect } from "react";
import { Tooltip } from "common-ui";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";

export const SHORTCUT_GLOBAL_SEARCH_QUERY = "globalSearchShortcut";

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

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  const [globalSearchQuery, setGlobalSearchQuery] = useSessionStorage<
    string | undefined
  >(SHORTCUT_GLOBAL_SEARCH_QUERY, undefined, {
    initializeWithValue: false
  });

  useEffect(() => {
    if (
      globalSearchQuery !== undefined &&
      setValue &&
      value !== globalSearchQuery
    ) {
      setValue(globalSearchQuery);
      setGlobalSearchQuery(undefined);
    }
  }, [globalSearchQuery, setValue, value]);

  return (
    <div className="input-group">
      <input
        type="text"
        value={value ?? ""}
        onChange={(newValue) => setValue?.(newValue?.target?.value)}
        className="form-control"
        placeholder={formatMessage({
          id: "queryBuilder_value_text_placeholder"
        })}
        onKeyDown={onKeyDown}
      />

      <Tooltip
        id={"queryBuilder_globalSearch_tooltip"}
        link={
          "https://aafc-bicoe.github.io/dina-documentation/#global_search_syntax"
        }
        linkText="queryBuilder_globalSearch_tooltipLink"
        placement="left"
      />
    </div>
  );
}

export function transformGlobalSearchToDSL({
  value
}: TransformToDSLProps): any {
  if (!value) {
    return {};
  }

  return {
    simple_query_string: {
      query: value,
      fields: ["*"]
    }
  };
}
