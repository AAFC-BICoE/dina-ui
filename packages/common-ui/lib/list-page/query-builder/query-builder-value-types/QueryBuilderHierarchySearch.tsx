const PARENT_HIERARCHY_RANK = 2;

export interface TransformHierarchySearchToDSL {
  uuid: string;
}

/**
 * Using the query row for a Hierarchy search, generate the elastic search request to be made.
 */
export function transformHierarchySearchToDSL({
  uuid
}: TransformHierarchySearchToDSL): any {
  return {
    nested: {
      path: "data.attributes.hierarchy",
      query: {
        bool: {
          must: [
            {
              match: {
                "data.attributes.hierarchy.uuid": uuid
              }
            },
            {
              match: {
                "data.attributes.hierarchy.rank": PARENT_HIERARCHY_RANK
              }
            }
          ]
        }
      }
    }
  };
}
