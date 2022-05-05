import Bodybuilder from "bodybuilder";
import { useEffect, useState } from "react";
import { useApiClient } from "..";

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
    builder.aggregation("terms", fieldName, {
      size: 1000
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

    setSuggestions(resp.data);
  }

  // Do not perform any searching if disabled. Return an empty result.
  // if (disabled) return { loading: false, response: { data: [] } };

  return suggestions;
}
