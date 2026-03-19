import { useState, useMemo } from "react";
import { useApiClient } from "../api-client/ApiClientContext";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { SEARCH_INDEXES } from "./searchConfig";

export interface ElasticsearchHit {
  _index: string;
  _id: string;
  _score?: number;
  _source: {
    data?: {
      id?: string;
      type?: string;
      attributes?: Record<string, any>;
    };
  };
  highlight?: Record<string, string[]>;
}

export interface IndexResult {
  indexName: string;
  count: number;
  topHits: ElasticsearchHit[];
}

export interface MultiIndexSearchResult {
  totalCount: number;
  indexResults: IndexResult[];
  topMatches: ElasticsearchHit[];
}

export interface UseMultiIndexSearchConfig {
  /** Initial search term */
  initialSearchTerm?: string;
  /** Group filter - defaults to user's current group */
  group?: string;
  /** Fields to search in. Defaults to all attributes */
  fields?: string[];
  /** Number of top results per index */
  topResultsPerIndex?: number;
}

/**
 * Hook for performing multi-index global search with aggregations
 *
 * This hook queries multiple Elasticsearch indexes simultaneously and returns:
 * - Total count across all indexes
 * - Count and top results for each index
 * - Overall top matches across all indexes
 */
export function useMultiIndexSearch(config: UseMultiIndexSearchConfig = {}) {
  const { apiClient } = useApiClient();
  const [searchTerm, setSearchTerm] = useState(config.initialSearchTerm || "");

  const { fields = ["data.attributes.*"], topResultsPerIndex = 10 } = config;

  // Build multi-index aggregation query
  const queryDSL = useMemo(() => {
    if (!searchTerm.trim()) {
      return null;
    }

    return {
      size: 0,
      query: {
        multi_match: {
          query: searchTerm,
          fields,
          lenient: true
        }
      },
      aggs: {
        index_counts: {
          terms: {
            field: "_index",
            size: 100
          },
          aggs: {
            top_results: {
              top_hits: {
                size: topResultsPerIndex,
                _source: {
                  includes: [
                    "data.id",
                    "data.type",
                    "data.attributes.name",
                    "data.attributes.displayName",
                    "data.attributes.materialSampleName",
                    "data.attributes.originalFilename",
                    "data.attributes.dwcFieldNumber"
                  ]
                },
                highlight: {
                  order: "score",
                  pre_tags: ["<em>"],
                  post_tags: ["</em>"],
                  fields: {
                    "data.attributes.*": {}
                  },
                  require_field_match: false
                }
              }
            }
          }
        }
      }
    };
  }, [searchTerm, fields, topResultsPerIndex]);

  const indexNames = (indexName?: string) =>
    (indexName
      ? SEARCH_INDEXES.filter((config) => config.indexName === indexName) ?? []
      : SEARCH_INDEXES
    )
      .map((config) => config.indexName)
      .join(",");

  // Fetcher function for SWR
  async function fetchMultiIndexSearch() {
    if (!queryDSL) {
      return undefined;
    }

    const response = await apiClient.axios.post(
      `search-api/search-ws/search?indexName=${indexNames()}`,
      queryDSL
    );

    // Helper to find aggregation key regardless of type prefix (e.g., "sterms#index_counts" -> "index_counts")
    const findAggKey = (obj: Record<string, any>, suffix: string) => {
      const key = Object.keys(obj || {}).find(
        (k) => k.endsWith(`#${suffix}`) || k === suffix
      );
      return key ? obj[key] : undefined;
    };

    // Process aggregation results
    const indexCountsAgg = findAggKey(
      response.data?.aggregations,
      "index_counts"
    );
    const buckets = indexCountsAgg?.buckets || [];

    const indexResults: IndexResult[] = buckets.map((bucket: any) => ({
      indexName: bucket.key,
      count: bucket.doc_count,
      topHits: findAggKey(bucket, "top_results")?.hits?.hits || []
    }));

    // Calculate total count
    const totalCount = indexResults.reduce((sum, ir) => sum + ir.count, 0);

    // Get top matches across all indexes (sorted by score)
    const allTopHits = indexResults.flatMap((ir) => ir.topHits);
    const topMatches = allTopHits
      .sort((a, b) => (b._score || 0) - (a._score || 0))
      .slice(0, topResultsPerIndex);

    return {
      totalCount,
      indexResults,
      topMatches
    };
  }

  const queryKey = JSON.stringify({ searchTerm, queryDSL });
  const cacheId = useMemo(() => uuidv4(), [queryKey]);

  const {
    data: searchResult,
    error,
    isValidating: pending
  } = useSWR(queryDSL ? [queryKey, cacheId] : null, fetchMultiIndexSearch, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return {
    handleSearch: setSearchTerm,
    searchTerm,
    searchResult,
    pending,
    error
  };
}
