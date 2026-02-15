import { useEffect, useState } from "react";
import { useApiClient } from "../../../api-client/ApiClientContext";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import {
  existsQuery,
  termQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import Select from "react-select";
import { useIntl } from "react-intl";

export interface QueryRowRelationshipAutocompleteSearchProps {
  /**
   * The current operator selected by the user.
   */
  matchType?: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * The ESIndexMapping for this specific relationship autocomplete field.
   */
  fieldMapping: ESIndexMapping;
}

export interface RelationshipAutocompleteSearchState {
  /** The selected resource UUID */
  selectedResourceUUID: string;

  /** The selected resource label for display */
  selectedResourceLabel: string;
}

interface ResourceOption {
  label: string;
  value: string;
  resource: any;
}

export function QueryRowRelationshipAutocompleteSearch({
  matchType,
  value,
  setValue,
  fieldMapping
}: QueryRowRelationshipAutocompleteSearchProps) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();

  const [searchState, setSearchState] =
    useState<RelationshipAutocompleteSearchState>(() =>
      value
        ? JSON.parse(value)
        : {
            selectedResourceUUID: "",
            selectedResourceLabel: ""
          }
    );

  // Resource options for the autocomplete
  const [resourceOptions, setResourceOptions] = useState<ResourceOption[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [resourceSearchInput, setResourceSearchInput] = useState("");

  const config = fieldMapping?.relationshipAutocompleteConfig;

  // Convert the state to a value that can be stored in the Query Builder
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(searchState));
    }
  }, [searchState, setValue]);

  // Currently selected resource option
  const selectedResourceOption: ResourceOption | null =
    searchState.selectedResourceUUID && searchState.selectedResourceLabel
      ? {
          label: searchState.selectedResourceLabel,
          value: searchState.selectedResourceUUID,
          resource: null
        }
      : null;

  // Load resources for autocomplete when the search input changes
  useEffect(() => {
    const apiEndpoint = config?.apiEndpoint;
    const optionLabelField = config?.optionLabel;

    if (!apiEndpoint || !optionLabelField) return;

    const loadResources = async () => {
      setIsLoadingResources(true);
      try {
        const response = await apiClient.get<any[]>(apiEndpoint, {
          filter: resourceSearchInput
            ? {
                rsql: `${optionLabelField}==*${resourceSearchInput}*`
              }
            : undefined,
          page: { limit: 25 }
        });

        const options: ResourceOption[] = (response?.data || []).map(
          (resource: any) => ({
            label: resource[optionLabelField] || resource.id,
            value: resource.id,
            resource
          })
        );

        setResourceOptions(options);
      } catch (error) {
        console.error("Error loading resources for autocomplete:", error);
        setResourceOptions([]);
      } finally {
        setIsLoadingResources(false);
      }
    };

    const debounceTimer = setTimeout(loadResources, 300);
    return () => clearTimeout(debounceTimer);
  }, [resourceSearchInput, config?.apiEndpoint, config?.optionLabel]);

  /**
   * Handle selection change.
   */
  const handleSelectionChange = (selected: ResourceOption | null) => {
    setSearchState({
      selectedResourceUUID: selected?.value ?? "",
      selectedResourceLabel: selected?.label ?? ""
    });
  };

  // For empty/notEmpty operators, no value input is needed (cardinality 0)
  if (matchType === "empty" || matchType === "notEmpty") {
    return null;
  }

  return (
    <div className="row">
      <Select<ResourceOption>
        options={resourceOptions}
        className="col me-1 ms-2 ps-0"
        value={selectedResourceOption}
        placeholder={formatMessage({
          id: "queryBuilder_autocomplete_placeholder"
        })}
        onChange={handleSelectionChange}
        onInputChange={(inputValue, { action }) => {
          if (action === "input-change") {
            setResourceSearchInput(inputValue);
          }
        }}
        inputValue={resourceSearchInput}
        isLoading={isLoadingResources}
        isClearable={true}
        captureMenuScroll={true}
        menuPlacement="auto"
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
        filterOption={() => true} // Disable client-side filtering since we filter server-side
      />
    </div>
  );
}

/**
 * Transform the relationship autocomplete search state into an ElasticSearch DSL query.
 *
 * The search uses the material sample index directly with a nested query on the
 * `included` array, filtering by the relationship type and matching the selected
 * resource UUID.
 */
export function transformRelationshipAutocompleteToDSL({
  value,
  operation,
  fieldInfo
}: TransformToDSLProps): any {
  const config = fieldInfo?.relationshipAutocompleteConfig;
  const elasticSearchPath = config?.elasticSearchRelationshipPath;
  const parentType = config?.referencedType;

  if (!elasticSearchPath) {
    return;
  }

  // Helper to create nested query for included relationships
  const createNestedQuery = (innerQuery: any) => {
    if (elasticSearchPath.startsWith("included.")) {
      return {
        nested: {
          path: "included",
          query: {
            bool: {
              must: [
                innerQuery,
                ...(parentType
                  ? [{ term: { "included.type": parentType } }]
                  : [])
              ]
            }
          }
        }
      };
    }
    return innerQuery;
  };

  // Handle empty/notEmpty operators
  if (operation === "empty") {
    if (elasticSearchPath.startsWith("included.")) {
      return {
        bool: {
          must_not: {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    existsQuery(elasticSearchPath),
                    ...(parentType
                      ? [{ term: { "included.type": parentType } }]
                      : [])
                  ]
                }
              }
            }
          }
        }
      };
    }
    return {
      bool: {
        must_not: existsQuery(elasticSearchPath)
      }
    };
  }
  if (operation === "notEmpty") {
    return createNestedQuery(existsQuery(elasticSearchPath));
  }

  // For equals/notEquals, parse the value for the UUID
  try {
    const { selectedResourceUUID }: RelationshipAutocompleteSearchState =
      JSON.parse(value);

    if (!selectedResourceUUID) {
      return;
    }

    if (operation === "equals") {
      return createNestedQuery(
        termQuery(elasticSearchPath, selectedResourceUUID, false)
      );
    }

    if (operation === "notEquals") {
      if (elasticSearchPath.startsWith("included.")) {
        return {
          bool: {
            must_not: {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      termQuery(elasticSearchPath, selectedResourceUUID, false),
                      ...(parentType
                        ? [{ term: { "included.type": parentType } }]
                        : [])
                    ]
                  }
                }
              }
            }
          }
        };
      }
      return {
        bool: {
          must_not: termQuery(elasticSearchPath, selectedResourceUUID, false)
        }
      };
    }
  } catch (e) {
    console.error(
      "Error transforming relationship autocomplete search to DSL:",
      e
    );
    return;
  }
}
