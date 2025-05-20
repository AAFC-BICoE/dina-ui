import React from "react";
import { ESIndexMapping } from "../../types";
import { useIntl } from "react-intl";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import useVocabularyOptions from "../../../../../dina-ui/components/collection/useVocabularyOptions";
import { LoadingSpinner } from "common-ui";
import Select from "react-select";

interface QueryRowVocabularySearchProps {
  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Index mapping configuration. This should contain the dynamic field configuration in order to
   * retrieve the vocabularies to display.
   */
  fieldConfig: ESIndexMapping;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

export default function QueryRowVocabularySearch({
  matchType,
  fieldConfig,
  value,
  setValue
}: QueryRowVocabularySearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  // Retrieve all the vocabulary options from the API endpoint.
  const { vocabOptions, loading } = useVocabularyOptions({
    path: fieldConfig?.dynamicField?.apiEndpoint ?? ""
  });

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {matchType !== "empty" && matchType !== "notEmpty" && (
        <>
          {loading ? (
            <LoadingSpinner loading={true} />
          ) : (
            <>
              {matchType === "in" || matchType === "notIn" ? (
                <Select
                  options={vocabOptions}
                  className={`col ps-0`}
                  value={(value?.split(",") ?? []).map((val) => {
                    return vocabOptions.find(
                      (pickOption) => pickOption.value === val
                    );
                  })}
                  placeholder={formatMessage({
                    id: "queryBuilder_pickList_multiple_placeholder"
                  })}
                  isMulti={true}
                  onChange={(pickListOption) =>
                    setValue?.(
                      (pickListOption.flat() ?? [])
                        .map((item) => item?.value ?? "")
                        .join(",")
                    )
                  }
                  onKeyDown={onKeyDown}
                />
              ) : (
                <Select
                  options={vocabOptions}
                  className={`col ps-0`}
                  value={vocabOptions?.find(
                    (pickOption) => pickOption.value === value
                  )}
                  placeholder={formatMessage({
                    id: "queryBuilder_pickList_placeholder"
                  })}
                  onChange={(pickListOption) =>
                    setValue?.(pickListOption?.value ?? "")
                  }
                  onKeyDown={onKeyDown}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

// The vocabulary search uses the same logic as the text search, but instead of using a text input,
// it uses a dropdown. See QueryRowTextSearch.tsx for query generation logic.
