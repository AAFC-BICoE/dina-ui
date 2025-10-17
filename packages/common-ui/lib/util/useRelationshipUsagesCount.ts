import Kitsu from "kitsu";
import { useCallback, useEffect, useState } from "react";

interface UseRelationshipUsagesCountProps {
  /**
   * The API client used to check if the number of usages.
   */
  apiClient: Kitsu;

  /**
   * The resource path to check for usages including the base-api.
   * Example: "collection-api/material-sample"
   */
  resourcePath: string;

  /**
   * The name of the relationship to check for usages. Example: "collectingEvent"
   */
  relationshipName?: string;

  /**
   * The UUID of the resource to check for usages against.
   */
  relationshipId?: string;
}

interface UseRelationshipUsagesCountReturn {
  usageCount: number | undefined;
  error: Error | undefined;
  isLoading: boolean;
}

/**
 * Get the number of usages for a specific relationship.
 *
 * For example, if you want to check how many times a material sample is attached to a collecting event,
 * you would pass the collecting event ID, the resource type "material-sample", and the relationship name "collectingEvent".
 *
 * This function will return the number of usages of that relationship.
 *
 * @see useRelationshipUsagesCount hook for a React-friendly way to fetch this data.
 */
export async function getNumberOfRelationshipUsages({
  apiClient,
  resourcePath,
  relationshipName,
  relationshipId
}: UseRelationshipUsagesCountProps) {
  // Generate the filter parameters based on the relationship name and ID.
  const params = {
    filter: {
      [`${relationshipName}.uuid`]: {
        EQ: relationshipId
      }
    },
    page: {
      limit: 0 // We only need to check the total usage count.
    }
  };

  const { meta } = await apiClient.get(resourcePath, params ?? {});

  return (meta as any)?.totalResourceCount || 0;
}

/**
 * A React hook that fetches and returns the number of usages for a specific relationship.
 *
 * @param {UseRelationshipUsagesCountProps} props - The properties for checking relationship usages.
 * @return {UseRelationshipUsagesCountReturn} - An object containing the usage count, error, and loading state.
 */
export function useRelationshipUsagesCount({
  apiClient,
  resourcePath,
  relationshipName,
  relationshipId
}: UseRelationshipUsagesCountProps): UseRelationshipUsagesCountReturn {
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoize the fetch function to prevent unnecessary re-renders of useEffect
  const fetchUsages = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const count = await getNumberOfRelationshipUsages({
        apiClient,
        resourcePath,
        relationshipName,
        relationshipId
      });
      setUsageCount(count);
    } catch (err) {
      setError(err as Error);
      setUsageCount(undefined); // Reset count on error
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, resourcePath, relationshipName, relationshipId]);

  // Effect to trigger the fetch when dependencies change
  useEffect(() => {
    if (apiClient && resourcePath && relationshipName && relationshipId) {
      fetchUsages();
    } else {
      setUsageCount(undefined);
      setIsLoading(false);
    }
  }, [fetchUsages, apiClient, resourcePath, relationshipId, relationshipName]);

  return {
    usageCount,
    error,
    isLoading
  };
}
