import { useEffect, useState } from "react";
import { useApiClient } from "..";
import { DynamicFieldsMappingConfig, ESIndexMapping } from "./types";
import { RELATIONSHIP_PRESENCE_FIELDNAME } from "./query-builder/useQueryBuilderConfig";

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

  /**
   * This will add an option to the QueryBuilder to allow users to check if a relationship exists.
   */
  enableRelationshipPresence?: boolean;
}

export interface OverrideRelationshipConfig {
  [referencedBy: string]: {
    [attributePath: string]: {
      /** Label to override with. */
      label?: string;

      /** Fields to be overrided in. */
      fields?: string[];

      /**
       * This is useful since reverse relationships are not included in the relationship section of
       * the query.
       */
      isReverseRelationship?: boolean;
    };
  };
}

export const overrideRelationshipConfig: OverrideRelationshipConfig = {
  "run-summary": {
    "attributes.name": {
      label: "runName",
      isReverseRelationship: true
    },
    "attributes.items.genericMolecularAnalysisItemSummary.name": {
      fields: ["keyword"],
      isReverseRelationship: true
    },
    "attributes.items.genericMolecularAnalysisItemSummary.genericMolecularAnalysisSummary.name":
      {
        fields: ["keyword"],
        isReverseRelationship: true
      },
    "attributes.items.genericMolecularAnalysisItemSummary.genericMolecularAnalysisSummary.analysisType":
      {
        fields: ["keyword"],
        isReverseRelationship: true
      }
  }
};

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
  dynamicFieldMapping,
  enableRelationshipPresence
}: UseIndexMappingProps) {
  const { apiClient } = useApiClient();

  // State to store the index map after it has been retrieved.
  const [indexMap, setIndexMap] = useState<ESIndexMapping[]>();

  // Retrieve the index mapping on the first hook load.
  useEffect(() => {
    async function getIndexMapping() {
      try {
        const mapping = await fetchQueryFieldsByIndex();
        setIndexMap(mapping);
      } catch (error) {
        // Handle the error here, e.g., log it or display an error message.
        console.error(error);
      }
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
      const fieldsToSkip = [
        ...(dynamicFieldMapping?.fields?.map<string>(
          (fieldMapping) => fieldMapping.path
        ) ?? []),
        ...(dynamicFieldMapping?.relationshipFields?.map<string>(
          (relationshipFieldMapping) => relationshipFieldMapping.path
        ) ?? [])
      ];

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
            hideField: fieldsToSkip.some((skipPath) =>
              path.startsWith(skipPath)
            ),
            type: key.type,
            subType: key?.subtype ? key.subtype : undefined,
            path: key.path,

            // Additional options for the field:
            distinctTerm: key.distinct_term_agg,
            keywordMultiFieldSupport: key?.fields?.includes("keyword") ?? false,
            keywordNumericSupport:
              key?.fields?.includes("keyword_numeric") ?? false,
            optimizedPrefix: key?.fields?.includes("prefix") ?? false,
            containsSupport: key?.fields?.includes("infix") ?? false,
            endsWithSupport: key?.fields?.includes("prefix_reverse") ?? false
          });
        });

      // Read relationship attributes.
      resp.data?.relationships?.map((relationship) => {
        relationship?.attributes?.map((relationshipAttribute) => {
          // Check if the relationship attribute is overridden.
          const overrideConfig =
            overrideRelationshipConfig?.[relationship.referencedBy]?.[
              relationshipAttribute.path + "." + relationshipAttribute.name
            ];

          // This is the user-friendly label to display on the search dropdown.
          const attributeLabel =
            overrideConfig?.label ??
            (relationshipAttribute.path?.includes(".")
              ? relationshipAttribute.path.substring(
                  relationshipAttribute.path.indexOf(".") + 1
                ) +
                "." +
                relationshipAttribute.name
              : relationshipAttribute.name);

          const fullPath =
            relationship.path +
            "." +
            relationshipAttribute.path +
            "." +
            attributeLabel;

          const relationshipFields: string[] =
            overrideConfig?.fields ?? relationshipAttribute?.fields ?? [];

          result.push({
            label: attributeLabel,
            value: relationship.referencedBy + "." + attributeLabel,
            hideField: fieldsToSkip.some((skipPath) =>
              fullPath.startsWith(skipPath)
            ),
            type: relationshipAttribute.type,
            subType: relationshipAttribute?.subtype
              ? relationshipAttribute.subtype
              : undefined,
            path: relationshipAttribute.path,
            parentName: relationship.referencedBy,
            parentType: relationship.value,
            parentPath: relationship.path,

            // Additional options for the field:
            distinctTerm: relationshipAttribute.distinct_term_agg,
            keywordMultiFieldSupport:
              relationshipFields?.includes("keyword") ?? false,
            keywordNumericSupport:
              relationshipFields?.includes("keyword_numeric") ?? false,
            optimizedPrefix: relationshipFields?.includes("prefix") ?? false,
            containsSupport: relationshipFields?.includes("infix") ?? false,
            endsWithSupport:
              relationshipFields?.includes("prefix_reverse") ?? false,
            isReverseRelationship:
              overrideConfig?.isReverseRelationship ?? false
          });
        });
      });

      // Inject dynamic field mapping config into these.
      if (dynamicFieldMapping) {
        dynamicFieldMapping.fields.forEach((fieldMapping) => {
          if (fieldMapping.type !== "unsupported") {
            result.push({
              dynamicField: fieldMapping,
              value: fieldMapping.path,
              distinctTerm: false,
              label: fieldMapping.label,
              path: fieldMapping.path,
              type: fieldMapping.type,
              keywordMultiFieldSupport: false,
              keywordNumericSupport: false,
              optimizedPrefix: false,
              containsSupport: false,
              endsWithSupport: false,
              hideField: false
            });
          }
        });
        dynamicFieldMapping.relationshipFields.forEach(
          (relationshipFieldMapping) => {
            if (relationshipFieldMapping.type !== "unsupported") {
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
                keywordMultiFieldSupport: false,
                keywordNumericSupport: false,
                optimizedPrefix: false,
                containsSupport: false,
                endsWithSupport: false,
                hideField: false,
                isReverseRelationship: false
              });
            }
          }
        );
      }

      // Add relationship presence to the query builder list.
      if (enableRelationshipPresence === true) {
        result.push({
          dynamicField: {
            apiEndpoint: RELATIONSHIP_PRESENCE_FIELDNAME,
            label: RELATIONSHIP_PRESENCE_FIELDNAME,
            path: RELATIONSHIP_PRESENCE_FIELDNAME,
            type: "relationshipPresence"
          },
          value: RELATIONSHIP_PRESENCE_FIELDNAME,
          distinctTerm: false,
          label: RELATIONSHIP_PRESENCE_FIELDNAME,
          path: RELATIONSHIP_PRESENCE_FIELDNAME,
          type: "relationshipPresence",
          keywordMultiFieldSupport: false,
          keywordNumericSupport: false,
          optimizedPrefix: false,
          containsSupport: false,
          endsWithSupport: false,
          hideField: false,
          isReverseRelationship: false
        });
      }

      return result;
    } catch {
      return undefined;
    }
  }

  return { indexMap };
}
