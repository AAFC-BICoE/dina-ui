import {
  DinaFormSection,
  FieldWrapperProps,
  LoadingSpinner,
  useApiClient,
  SelectField
} from "..";
import { QueryRow } from "./QueryRow";
import { FieldArray } from "formik";
import { useEffect } from "react";
import { ESIndexMapping } from "./types";
import { QueryPageActions, QueryPageStates } from "./queryPageReducer";
import { useAvailableGroupOptions } from "packages/dina-ui/components/group-select/GroupSelectField";

interface QueryBuilderProps extends FieldWrapperProps {
  dispatch: React.Dispatch<QueryPageActions>;
  states: QueryPageStates;
}

export function QueryBuilder({ name, dispatch, states }: QueryBuilderProps) {
  const { apiClient } = useApiClient();

  const {
    indexName,
    indexLoading,
    elasticSearchIndex,
    performIndexRequest,
    performGroupRequest,
    groups
  } = states;

  // Ensure that the index request is only done once per page load.
  useEffect(() => {
    if (performIndexRequest) {
      fetchQueryFieldsByIndex();
    }
  }, [performIndexRequest]);

  // Ensure the groups are only loaded once per page load.
  useEffect(() => {
    if (performGroupRequest) {
      fetchGroups();
    }
  }, [performGroupRequest]);

  /**
   * The query builder options are generated from the elastic search index. This method will
   * request the mappings from the index.
   */
  async function fetchQueryFieldsByIndex() {
    const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
      params: { indexName }
    });

    const result: ESIndexMapping[] = [];

    // Read index attributes.
    resp.data.body?.attributes
      ?.filter(key => key.name !== "type")
      .map(key => {
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
    resp.data.body?.relationships?.map(relationship => {
      relationship?.attributes?.map(relationshipAttribute => {
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
          parentName: relationship.value,
          parentPath: relationship.path,
          distinctTerm: relationshipAttribute.distinct_term_agg
        });
      });
    });

    dispatch({ type: "INDEX_CHANGE", index: result });
  }

  async function fetchGroups() {
    dispatch({
      type: "GROUP_CHANGE",
      newGroups: [{ label: "aafc", value: "aafc" }]
    });
  }

  // Display loading spinner when performing request for the index.
  if (indexLoading) {
    return <LoadingSpinner loading={true} />;
  }

  const sortedData = elasticSearchIndex
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));

  return (
    <>
      <FieldArray name={name}>
        {fieldArrayProps => {
          const elements: [] = fieldArrayProps.form.values.queryRows;

          function addRow() {
            fieldArrayProps.push(
              <QueryRow
                dispatch={dispatch}
                states={states}
                name={fieldArrayProps.name}
                index={elements?.length ?? 0}
                removeRow={removeRow}
                addRow={addRow}
              />
            );
            // initialize the logic switch value to be "and"//
            fieldArrayProps.form.setFieldValue(
              `${fieldArrayProps.name}[${
                elements?.length ?? 0
              }].compoundQueryType`,
              "and"
            );
          }

          function removeRow(index) {
            fieldArrayProps.remove(index);
          }

          return elements?.length > 0
            ? elements?.map((_, index) => (
                <QueryRow
                  name={fieldArrayProps.name}
                  dispatch={dispatch}
                  states={states}
                  key={index}
                  index={index}
                  addRow={addRow}
                  removeRow={removeRow}
                />
              ))
            : null;
        }}
      </FieldArray>
      <DinaFormSection horizontal={"flex"}>
        <SelectField
          isMulti={true}
          name="group"
          className="col-md-4"
          onChange={(value, formik) =>
            dispatch({
              type: "SEARCH_FILTER_CHANGE",
              newFilter: { ...formik.values, group: value }
            })
          }
          options={groups}
        />
      </DinaFormSection>
    </>
  );
}
