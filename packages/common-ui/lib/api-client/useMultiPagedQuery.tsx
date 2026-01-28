import { useApiClient } from "common-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface QueryConfig {
  path: string;

  filter?: Record<string, any>;

  sort?: string;

  fields?: Record<string, string>;

  include?: string;
}

interface UseMultiPagedQueryResult<T> {
  data: T[];

  loading: boolean;

  totalCount: number;

  error: any;

  reload: () => void;
}

interface QueryCountInfo {
  queryIndex: number;
  count: number;
  startIndex: number; // The global start index for this query's results
  endIndex: number; // The global end index (exclusive) for this query's results
}

interface QueryFetchPlan {
  queryIndex: number;
  config: QueryConfig;
  limit?: number;
  offset?: number;
}

export function useMultiPagedQuery<T = any>(
  queries: QueryConfig[],
  pageSize: number,
  offset: number
): UseMultiPagedQueryResult<T> {
  const { apiClient } = useApiClient();

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<any>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Create a stable key for dependencies
  const queriesKey = useMemo(() => JSON.stringify(queries), [queries]);

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (queries.length === 0) {
        setData([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: Get total counts for each query using limit=0
        const countPromises = queries.map((config) =>
          apiClient.get(config.path, {
            filter: config.filter,
            sort: config.sort,
            page: { limit: 0 }
          })
        );

        const countResponses = await Promise.all(countPromises);

        if (cancelled) return;

        // Build query count info with global indices
        const queryCountInfos: QueryCountInfo[] = [];
        let runningIndex = 0;

        for (let i = 0; i < countResponses.length; i++) {
          const meta = countResponses[i].meta as
            | { totalResourceCount?: number }
            | undefined;
          const count = meta?.totalResourceCount ?? 0;
          queryCountInfos.push({
            queryIndex: i,
            count,
            startIndex: runningIndex,
            endIndex: runningIndex + count
          });
          runningIndex += count;
        }

        const total = runningIndex;
        setTotalCount(total);

        // Step 2: Calculate which queries need to run based on offset and pageSize
        const requestedStart = offset;
        const requestedEnd = offset + pageSize;

        // Find queries that overlap with the requested range
        const fetchPlans: QueryFetchPlan[] = [];

        for (const info of queryCountInfos) {
          // Check if this query's range overlaps with the requested range
          if (
            info.endIndex <= requestedStart ||
            info.startIndex >= requestedEnd
          ) {
            // No overlap, skip this query
            continue;
          }

          // Calculate the local offset and limit for this query
          const localStart = Math.max(0, requestedStart - info.startIndex);
          const localEnd = Math.min(info.count, requestedEnd - info.startIndex);
          const localLimit = localEnd - localStart;

          if (localLimit > 0) {
            fetchPlans.push({
              queryIndex: info.queryIndex,
              config: queries[info.queryIndex],
              limit: localLimit,
              offset: localStart > 0 ? localStart : undefined
            });
          }
        }

        // Step 3: Perform the actual queries
        if (fetchPlans.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const dataPromises = fetchPlans.map((plan) =>
          apiClient.get(plan.config.path, {
            filter: plan.config.filter,
            sort: plan.config.sort,
            fields: plan.config.fields,
            include: plan.config.include,
            page: {
              limit: plan.limit,
              offset: plan.offset
            }
          })
        );

        const dataResponses = await Promise.all(dataPromises);

        if (cancelled) return;

        // Step 4: Merge results
        const mergedData: T[] = [];
        for (const response of dataResponses) {
          const responseData = response.data;
          if (Array.isArray(responseData)) {
            mergedData.push(...(responseData as T[]));
          } else if (responseData) {
            mergedData.push(responseData as T);
          }
        }

        setData(mergedData);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [queriesKey, pageSize, offset, reloadTrigger, apiClient]);

  return {
    data,
    loading,
    totalCount,
    error,
    reload
  };
}
