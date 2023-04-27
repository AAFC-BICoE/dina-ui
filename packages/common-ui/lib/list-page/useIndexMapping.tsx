import { useEffect, useState } from "react";
import { useApiClient } from "..";
import { DynamicFieldsMappingConfig, ESIndexMapping } from "./types";

export interface UseIndexMappingProps {
  indexName: string;

  /**
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;
}

/**
 * Custom hook for retrieving the index mapping.
 *
 * The index mapping is used to get all of the fields supported for searching. Also contains
 * additional information on each field.
 *
 * @param indexName The index to retrieve. Example: `dina-material-sample-index`
 */
export function useIndexMapping({
  indexName,
  dynamicFieldMapping
}: UseIndexMappingProps) {
  const { apiClient } = useApiClient();

  // State to store the index map after it has been retrieved.
  const [indexMap, setIndexMap] = useState<ESIndexMapping[]>();

  // Retrieve the index mapping on the first hook load.
  useEffect(() => {
    async function getIndexMapping() {
      const mapping = await fetchQueryFieldsByIndex();
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
  async function fetchQueryFieldsByIndex() {
    try {
      const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
        params: { indexName }
      });

      // Fields that are dynamic do not need to be listed here.
      const fieldsToSkip =
        dynamicFieldMapping?.fields?.map<string>(
          (fieldMapping) => fieldMapping.path
        ) ?? [];

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

          // Manually remove managed attributes and extension fields from here,
          // they are handled using the dynamic mapping config. See the dynamicFieldMapping.
          if (!fieldsToSkip.some((skipPath) => path.startsWith(skipPath))) {
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
              containsSupport: key?.fields?.includes("infix") ?? false,
              endsWithSupport: key?.fields?.includes("prefix_reverse") ?? false
            });
          }
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
            containsSupport:
              relationshipAttribute?.fields?.includes("infix") ?? false,
            endsWithSupport:
              relationshipAttribute?.fields?.includes("prefix_reverse") ?? false
          });
        });
      });

      // Inject dynamic field mapping config into these.
      if (dynamicFieldMapping) {
        dynamicFieldMapping.fields.forEach((fieldMapping) => {
          result.push({
            dynamicField: fieldMapping,
            value: fieldMapping.path,
            distinctTerm: false,
            label: fieldMapping.label,
            path: fieldMapping.path,
            type: fieldMapping.type,
            startsWithSupport: false,
            containsSupport: false,
            endsWithSupport: false
          });
        });
        dynamicFieldMapping.relationshipFields.forEach(
          (relationshipFieldMapping) => {
            result.push({
              dynamicField: relationshipFieldMapping,
              parentName: relationshipFieldMapping.referencedBy,
              parentPath: "included",
              parentType: relationshipFieldMapping.referencedType,
              value:
                relationshipFieldMapping.path +
                "_" +
                relationshipFieldMapping.referencedBy,
              distinctTerm: false,
              label: relationshipFieldMapping.label,
              path: relationshipFieldMapping.path,
              type: relationshipFieldMapping.type,
              startsWithSupport: false,
              containsSupport: false,
              endsWithSupport: false
            });
          }
        );
      }

      return result;
    } catch (error) {
      return undefined;
    }
  }

  return { indexMap };
}
