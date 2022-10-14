import Bodybuilder from "bodybuilder";
import { castArray } from "lodash";
import { useEffect, useState } from "react";
import { useApiClient } from "..";

const TOTAL_SUGGESTIONS: number = 100;
const AGGREGATION_NAME: string = "term_aggregation";
const AGGREGATION_FILTER_NAME: string = "included_type_filter";
const NEST_AGGREGATION_NAME: string = "included_aggregation";

interface QuerySuggestionFieldProps {
  /** The string you want elastic search to use. */
  fieldName?: string;

  /** If the field is a relationship, we need to know the type to filter it. */
  relationshipType?: string;

  /** An array of the groups to filter the distinct terms by. This can be an empty group which will skip filtering by group. */
  groups: string[];

  /** The index you want elastic search to perform the search on */
  indexName: string;
}

export function useElasticSearchDistinctTerm({
  fieldName,
  relationshipType,
  groups,
  indexName
}: QuerySuggestionFieldProps) {
  const { apiClient } = useApiClient();

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Every time the textEntered has changed, perform a new request for new suggestions.
  useEffect(() => {
    if (!fieldName) return;
    queryElasticSearchForSuggestions();
  }, [fieldName, relationshipType, groups]);

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
      builder.aggregation(
        "nested",
        { path: "included" },
        NEST_AGGREGATION_NAME,
        (includeAgg) =>
          includeAgg.aggregation(
            "filter",
            {
              bool: {
                filter: [{ term: { "included.type": relationshipType } }]
              }
            },
            AGGREGATION_FILTER_NAME,
            (agg) =>
              agg.aggregation(
                "terms",
                fieldName + ".keyword",
                {
                  size: TOTAL_SUGGESTIONS
                },
                AGGREGATION_NAME
              )
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
      .then((resp) => {
        // The path to the results in the response changes if it contains the nested aggregation.
        if (relationshipType) {
          setSuggestions(
            resp?.data?.aggregations?.[NEST_AGGREGATION_NAME]?.[
              AGGREGATION_FILTER_NAME
            ]?.[AGGREGATION_NAME]?.buckets?.map((bucket) => bucket.key)
          );
        } else {
          setSuggestions(
            resp?.data?.aggregations?.[AGGREGATION_NAME]?.buckets?.map(
              (bucket) => bucket.key
            )
          );
        }
      })
      .catch(() => {
        // If any issues have occurred, just return an empty list.
        setSuggestions([]);
      });
  }

  return suggestions;
}
