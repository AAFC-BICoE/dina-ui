import Bodybuilder from "bodybuilder";
import { useEffect, useState } from "react";
import { useApiClient } from "..";

const AGGREGATION_NAME = "term_aggregation";
const NEST_AGGREGATION_NAME = "included_aggregation";

interface QuerySuggestionFieldProps {
  /** The string you want elastic search to use. */
  fieldName: string;

  /** If the field is a relationship, we need to know the type to filter it. */
  relationshipType?: string;

  /** The index you want elastic search to perform the search on */
  indexName: string;
}

export function useElasticSearchDistinctTerm({
  fieldName,
  relationshipType,
  indexName
}: QuerySuggestionFieldProps) {
  const { apiClient } = useApiClient();

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Every time the textEntered has changed, perform a new request for new suggestions.
  useEffect(() => {
    queryElasticSearchForSuggestions();
  }, []);

  async function queryElasticSearchForSuggestions() {
    // Use bodybuilder to generate the query to send to elastic search.
    const builder = Bodybuilder();
    builder.size(0);

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
                size: 1000
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
          size: 1000
        },
        AGGREGATION_NAME
      );
    }

    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      builder.build(),
      {
        params: {
          indexName
        }
      }
    );

    setSuggestions(
      resp?.data?.aggregations?.[NEST_AGGREGATION_NAME as string]?.[
        AGGREGATION_NAME as string
      ]?.buckets?.map(bucket => bucket.key)
    );
  }

  // Do not perform any searching if disabled. Return an empty result.
  // if (disabled) return { loading: false, response: { data: [] } };

  return suggestions;
}
