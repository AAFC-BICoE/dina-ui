import Bodybuilder from "bodybuilder";
import { useEffect, useState } from "react";
import { useApiClient } from "..";

const AGGREGATION_NAME = "term_aggregation";

interface QuerySuggestionFieldProps {
  /** The string you want elastic search to use. */
  fieldName: string;

  /** The index you want elastic search to perform the search on */
  indexName: string;
}

export function useElasticSearchDistinctTerm({
  fieldName,
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
    builder.aggregation(
      "terms",
      "included.attributes.name.keyword",
      {
        size: 1000
      },
      AGGREGATION_NAME
    );
    builder.query("nested", { path: "included" }, queryBuilder => {
      return queryBuilder.query("match", "included.type", "preparation-type");
    });

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
      resp?.data?.aggregations?.[AGGREGATION_NAME as string]?.buckets
    );
  }

  // Do not perform any searching if disabled. Return an empty result.
  // if (disabled) return { loading: false, response: { data: [] } };

  return suggestions;
}
