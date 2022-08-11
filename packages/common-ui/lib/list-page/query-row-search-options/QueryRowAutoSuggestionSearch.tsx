import { useFormikContext } from "formik";
import { fieldProps } from "../QueryRow";
import { ESIndexMapping } from "../types";
import { useElasticSearchDistinctTerm } from "../useElasticSearchDistinctTerm";
import { AutoSuggestTextField } from "../../formik-connected/AutoSuggestTextField";
import { SelectField } from "../../formik-connected/SelectField";
import { FieldSpy } from "../..";

/**
 * The match options when a suggestion text search is being performed.
 *
 * Empty and Not Empty can be used if the text value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowAutoSuggestionTextSearchProps {
  /**
   * The form name for the whole query builder.
   */
  queryBuilderName: string;

  /**
   * The index where this search is being performed from.
   *
   * This is because you can have multiple QueryRows in the same QueryBuilder.
   */
  index: number;

  /**
   * When doing a auto suggestion search, elastic search is used to find the distinct values to
   * provide as suggestions.
   *
   * The index name is required for this elastic search to determine what index to search.
   */
  indexName: string;

  /**
   * The elastic search mapping changes based on the field that is selected. This is used to
   * create the field name for the elastic search request.
   */
  elasticSearchMapping?: ESIndexMapping;
}

export default function QueryRowAutoSuggestionTextSearch({
  queryBuilderName,
  index,
  indexName,
  elasticSearchMapping
}: QueryRowAutoSuggestionTextSearchProps) {
  const formikProps = useFormikContext();
  const selectedGroups: string[] = (formikProps.values as any)?.group;

  return (
    <>
      <SelectField
        name={fieldProps(queryBuilderName, "matchType", index)}
        options={queryRowMatchOptions}
        className="me-1 flex-fill"
        removeLabel={true}
      />

      {/* Depending on the matchType, it changes the rest of the query row. */}
      <FieldSpy<string>
        fieldName={fieldProps(queryBuilderName, "matchType", index)}
      >
        {(matchType, _fields) =>
          matchType !== "empty" &&
          matchType !== "notEmpty" && (
            <AutoSuggestTextField
              name={fieldProps(queryBuilderName, "matchValue", index)}
              removeLabel={true}
              className="me-1 flex-fill"
              blankSearchBackend={"preferred"}
              customOptions={value =>
                useElasticSearchDistinctTerm({
                  fieldName:
                    elasticSearchMapping?.parentPath +
                    "." +
                    elasticSearchMapping?.path +
                    "." +
                    elasticSearchMapping?.label,
                  groups: selectedGroups,
                  relationshipType: elasticSearchMapping?.parentType,
                  indexName
                })?.filter(suggestion =>
                  suggestion?.toLowerCase()?.includes(value?.toLowerCase())
                )
              }
            />
          )
        }
      </FieldSpy>
    </>
  );
}
