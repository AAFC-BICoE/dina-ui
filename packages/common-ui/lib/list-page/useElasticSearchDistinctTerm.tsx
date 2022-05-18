import Bodybuilder from "bodybuilder";
import { castArray } from "lodash";
import { useEffect } from "react";
import { useApiClient } from "..";
import { QueryPageActions, QueryPageStates } from "./queryPageReducer";

const TOTAL_SUGGESTIONS: number = 100;
const AGGREGATION_NAME: string = "term_aggregation";
const NEST_AGGREGATION_NAME: string = "included_aggregation";

interface QuerySuggestionFieldProps {
  /**
   * Perform actions using the reducer. This is the "brains" of the Query Page.
   */
  dispatch: React.Dispatch<QueryPageActions>;

  /**
   * Retrieve all of the states from the reducer.
   */
  states: QueryPageStates;

  /** The string you want elastic search to use. */
  fieldName: string;

  /** If the field is a relationship, we need to know the type to filter it. */
  relationshipType?: string;

  /** The index you want elastic search to perform the search on */
  indexName: string;

  /** The index being rendered. */
  index: number;
}

export function useElasticSearchDistinctTerm({
  dispatch,
  states,
  fieldName,
  relationshipType,
  indexName,
  index
}: QuerySuggestionFieldProps) {
  const { apiClient } = useApiClient();
  const { performSuggestionRequest, searchFilters, suggestions } = states;
  const groups = searchFilters?.group;

  // Every time the textEntered has changed, perform a new request for new suggestions.
  useEffect(() => {
    if (performSuggestionRequest) {
      queryElasticSearchForSuggestions();
    }
  }, [performSuggestionRequest]);

  async function queryElasticSearchForSuggestions() {
    // Use bodybuilder to generate the query to send to elastic search.
    const builder = Bodybuilder();
    builder.size(0);

    // Group needs to be queried to only show the users most used values.
    if (groups && groups.length !== 0) {
      // terms is used to be able to support multiple groups.
      builder.query("terms", "data.attributes.group", castArray(groups));
    }

    // If the field has a relationship type, we need to do a nested query to filter it.
    if (relationshipType) {
      builder
        .query("nested", { path: "included" }, queryBuilder => {
          return queryBuilder.query("match", "included.type", relationshipType);
        })
        .aggregation(
          "nested",
          { path: "included" },
          NEST_AGGREGATION_NAME,
          agg =>
            agg.aggregation(
              "terms",
              fieldName + ".keyword",
              {
                size: TOTAL_SUGGESTIONS
              },
              AGGREGATION_NAME
            )
        );
    } else {
      // If it's an attribute, no need to use nested filters.
      builder.aggregation(
        "terms",
        fieldName + ".keyword",
        {
          size: TOTAL_SUGGESTIONS
        },
        AGGREGATION_NAME
      );
    }

    await apiClient.axios
      .post(`search-api/search-ws/search`, builder.build(), {
        params: {
          indexName
        }
      })
      .then(resp => {
        // The path to the results in the response changes if it contains the nested aggregation.
        if (relationshipType) {
          dispatch({
            type: "SUGGESTION_CHANGE",
            newSuggestions: resp?.data?.aggregations?.[NEST_AGGREGATION_NAME]?.[
              AGGREGATION_NAME
            ]?.buckets?.map(bucket => bucket.key),
            index
          });
        } else {
          dispatch({
            type: "SUGGESTION_CHANGE",
            newSuggestions: resp?.data?.aggregations?.[
              AGGREGATION_NAME
            ]?.buckets?.map(bucket => bucket.key),
            index
          });
        }
      })
      .catch(() => {
        // If any issues have occurred, just return an empty list.
        dispatch({ type: "SUGGESTION_CHANGE", newSuggestions: [], index });
      });
  }

  return suggestions[index];
}
