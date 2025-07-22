import Kitsu from "kitsu";

interface GetNumberOfRelationshipUsagesProps {
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

/**
 * Get the number of usages for a specific relationship.
 *
 * For example, if you want to check how many times a material sample is attached to a collecting event,
 * you would pass the collecting event ID, the resource type "material-sample", and the relationship name "collectingEvent".
 *
 * This function will return the number of usages of that relationship.
 */
export async function getNumberOfRelationshipUsages({
  apiClient,
  resourcePath,
  relationshipName,
  relationshipId
}: GetNumberOfRelationshipUsagesProps) {
  // Generate the filter parameters based on the relationship name and ID.
  const params = {
    filter: {
      [`${relationshipName}.id`]: {
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
