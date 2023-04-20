import { useEffect, useState } from "react";
import { useApiClient } from "..";
import { ESIndexMapping } from "./types";

/**
 * Custom hook for retrieving the index mapping.
 *
 * The index mapping is used to get all of the fields supported for searching. Also contains
 * additional information on each field.
 *
 * @param indexName The index to retrieve. Example: `dina-material-sample-index`
 */
export function useIndexMapping(indexName: string) {
  const { apiClient } = useApiClient();

  // State to store the index map after it has been retrieved.
  const [indexMap, setIndexMap] = useState<ESIndexMapping[]>();

  // Retrieve the index mapping on the first hook load.
  useEffect(() => {
    async function getIndexMapping() {
      const mapping = await fetchQueryFieldsByIndex(indexName);
      setIndexMap(mapping);
    }
    getIndexMapping();
  }, []);

  /**
   * The query builder options are generated from the elastic search index. This method will
   * request the mappings from the index.
   *
   * @param searchIndexName index to retrieve from.
   * @returns ESIndexMapping[]
   */
  async function fetchQueryFieldsByIndex(searchIndexName) {
    try {
      const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
        params: { indexName: searchIndexName }
      });

      const result: ESIndexMapping[] = [];

      // Read index attributes.
      resp.data?.attributes
        ?.filter((key) => key.name !== "type")
        .map((key) => {
          const path = key.path;
          const prefix = "data.attributes";
          let attrPrefix;
          if (path && path.includes(prefix)) {
            attrPrefix = path.substring(prefix.length + 1);
          }
          result.push({
            label: attrPrefix ? attrPrefix + "." + key.name : key.name,
            value: key.path
              ? key.path + "." + key.name
              : key.name === "id"
              ? "data." + key.name
              : key.name,
            type: key.type,
            path: key.path,

            // Additional options for the field:
            distinctTerm: key.distinct_term_agg,
            startsWithSupport: key?.fields?.includes("prefix") ?? false,
            infixSupport: key?.fields?.includes("infix") ?? false,
            endsWithSupport: key?.fields?.includes("prefix_reverse") ?? false
          });
        });

      // Read relationship attributes.
      resp.data?.relationships?.map((relationship) => {
        relationship?.attributes?.map((relationshipAttribute) => {
          // This is the user-friendly label to display on the search dropdown.
          const attributeLabel = relationshipAttribute.path?.includes(".")
            ? relationshipAttribute.path.substring(
                relationshipAttribute.path.indexOf(".") + 1
              ) +
              "." +
              relationshipAttribute.name
            : relationshipAttribute.name;

          result.push({
            label: attributeLabel,
            value: relationship.value + "." + attributeLabel,
            type: relationshipAttribute.type,
            path: relationshipAttribute.path,
            parentName: relationship.referencedBy,
            parentType: relationship.value,
            parentPath: relationship.path,

            // Additional options for the field:
            distinctTerm: relationshipAttribute.distinct_term_agg,
            startsWithSupport:
              relationshipAttribute?.fields?.includes("prefix") ?? false,
            infixSupport:
              relationshipAttribute?.fields?.includes("infix") ?? false,
            endsWithSupport:
              relationshipAttribute?.fields?.includes("prefix_reverse") ?? false
          });
        });
      });

      return result;
    } catch (error) {
      return undefined;
    }
  }

  return { indexMap };
}
