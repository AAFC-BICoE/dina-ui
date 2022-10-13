import { useFormikContext } from "formik";
import { ESIndexMapping } from "../../types";
import { useElasticSearchDistinctTerm } from "../../useElasticSearchDistinctTerm";
import { AutoSuggestTextField } from "../../../formik-connected/AutoSuggestTextField";

interface QueryBuilderAutoSuggestionTextSearchProps {
  /**
   * Current field selected in the Query Builder.
   */
  currentFieldName?: string;

  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue: ((fieldPath: string) => void) | undefined;

  /**
   * Required in order to know what index to search against elastic search for the suggestions.
   */
  indexName: string;

  /**
   * The elastic search mapping changes based on the field that is selected. This is used to
   * create the field name for the elastic search request.
   */
  indexMap?: ESIndexMapping[];
}

export default function QueryBuilderAutoSuggestionTextSearch({
  currentFieldName,
  matchType,
  // value,
  // setValue,
  indexName,
  indexMap
}: QueryBuilderAutoSuggestionTextSearchProps) {
  const formikProps = useFormikContext();
  const selectedGroups: string[] = (formikProps.values as any)?.group;

  const elasticSearchMapping = indexMap?.find(
    (attribute) => attribute.value === currentFieldName // might need to be path instead.
  );

  const fieldName = elasticSearchMapping?.parentPath
    ? elasticSearchMapping?.parentPath +
      "." +
      elasticSearchMapping?.path +
      "." +
      elasticSearchMapping?.label
    : elasticSearchMapping?.path + "." + elasticSearchMapping?.label;

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {(matchType === "equals" || matchType === "notEquals") && (
        <AutoSuggestTextField
          name={"this-needs-to-be-removed"}
          removeLabel={true}
          className="me-1 flex-fill"
          blankSearchBackend={"preferred"}
          customOptions={(searchValue) =>
            useElasticSearchDistinctTerm({
              fieldName: fieldName ?? "",
              groups: selectedGroups,
              relationshipType: elasticSearchMapping?.parentType,
              indexName
            })?.filter((suggestion) =>
              suggestion?.toLowerCase()?.includes(searchValue?.toLowerCase())
            )
          }
        />
      )}
    </>
  );
}
