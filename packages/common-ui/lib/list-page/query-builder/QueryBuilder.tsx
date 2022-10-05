import {
  DinaFormSection,
  FieldWrapperProps,
  LoadingSpinner,
  useApiClient
} from "../..";
import { GroupSelectField } from "../../../../dina-ui/components";
import { useEffect } from "react";
import { ESIndexMapping } from "../types";
import { Query, Builder, Utils } from "react-awesome-query-builder";
import { useState, useCallback } from "react";
import {
  Config,
  ImmutableTree,
  BuilderProps
} from "react-awesome-query-builder";
import { generateBuilderConfig } from "./QueryBuilderConfig";

interface QueryBuilderProps extends FieldWrapperProps {
  indexName: string;
  onGroupChange: (currentSubmittedValues: any) => void;
  queryBuilderTree?: ImmutableTree;
  setQueryBuilderTree: (newQueryTree: ImmutableTree) => void;
  queryBuilderConfig?: Config;
  setQueryBuilderConfig: (newConfig: Config) => void;
}

export function QueryBuilder({
  indexName,
  onGroupChange,
  queryBuilderTree,
  setQueryBuilderTree,
  queryBuilderConfig,
  setQueryBuilderConfig
}: QueryBuilderProps) {
  const { apiClient } = useApiClient();

  // State to store the index map after it has been retrieved.
  const [indexMap, setIndexMap] = useState<ESIndexMapping[]>([]);

  // Once the index map is loaded, then the query builder can be generated.
  useEffect(() => {
    if (!indexMap) return;

    const newConfig = generateBuilderConfig(indexMap, indexName);
    if (!newConfig) return;

    setQueryBuilderConfig(newConfig);
  }, [indexMap]);

  const onChange = useCallback((immutableTree: ImmutableTree) => {
    setQueryBuilderTree(immutableTree);
  }, []);

  const renderBuilder = useCallback(
    (props: BuilderProps) => (
      <div className="query-builder-container">
        <div className="query-builder qb-lite">
          <Builder {...props} />
        </div>
      </div>
    ),
    []
  );

  // Retrieve the index mapping.
  useEffect(() => {
    async function getIndexMapping() {
      const mapping = await fetchQueryFieldsByIndex(indexName);
      setIndexMap(mapping);
    }
    getIndexMapping();
  }, [indexName]);

  /**
   * The query builder options are generated from the elastic search index. This method will
   * request the mappings from the index.
   *
   * @param searchIndexName index to retrieve from.
   * @returns ESIndexMapping[]
   */
  async function fetchQueryFieldsByIndex(searchIndexName) {
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
          distinctTerm: key.distinct_term_agg
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
          distinctTerm: relationshipAttribute.distinct_term_agg
        });
      });
    });
    return result;
  }

  // Display loading spinner when performing request for the index.
  if (!indexMap || !queryBuilderTree || !queryBuilderConfig) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <>
      <Query
        {...queryBuilderConfig}
        value={queryBuilderTree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField
          isMulti={true}
          name="group"
          className="col-md-4 mt-3"
          onChange={(value, formik) =>
            onGroupChange({
              submittedValues: { ...formik.values, group: value }
            })
          }
        />
      </DinaFormSection>
    </>
  );
}

/**
 * Empty query tree, used as the default when loading the page.
 */
export function defaultQueryTree(): ImmutableTree {
  return Utils.loadTree({
    id: Utils.uuid(),
    type: "group",
    children1: [
      {
        type: "rule",
        properties: {
          field: null,
          operator: null,
          value: [],
          valueSrc: [],
          valueError: []
        }
      }
    ]
  });
}
