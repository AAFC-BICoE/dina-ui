import {
  DinaFormSection,
  FieldWrapperProps,
  LoadingSpinner,
  SelectField,
  useApiClient
} from "..";
import { QueryRow } from "./QueryRow";
import { FieldArray } from "formik";
import { GroupSelectField } from "../../../dina-ui/components";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import useSWR from "swr";
import { ESIndexMapping } from "./types";

import {
  Query,
  Builder,
  Utils as QbUtils,
  BasicConfig
} from "react-awesome-query-builder";
import { useState, useCallback } from "react";
import {
  JsonGroup,
  Config,
  ImmutableTree,
  BuilderProps
} from "react-awesome-query-builder";
import { Button } from "react-bootstrap";

const queryValue: JsonGroup = { id: QbUtils.uuid(), type: "group" };

interface QueryBuilderProps extends FieldWrapperProps {
  indexName: string;
  onGroupChange: (currentSubmittedValues: any) => void;
}

export function QueryBuilder({
  name,
  indexName,
  onGroupChange
}: QueryBuilderProps) {
  const { apiClient } = useApiClient();

  const config: Config = {
    conjunctions: {
      ...BasicConfig.conjunctions
    },
    operators: {
      equals: {
        label: "equals"
      }
    },
    widgets: {
      ...BasicConfig.widgets
    },
    types: {
      ...BasicConfig.types
    },
    fields: {
      test: {
        label: "test",
        type: "number"
      }
    },
    settings: {
      ...BasicConfig.settings,
      renderButton: (buttonProps) => {
        if (buttonProps) {
          switch (buttonProps?.type) {
            case "addRule":
            case "addGroup":
              return (
                <Button onClick={buttonProps?.onClick} className="ms-1">
                  {buttonProps.label}
                </Button>
              );
            case "delGroup":
            case "delRule":
            case "delRuleGroup":
              return (
                <Button
                  onClick={buttonProps?.onClick}
                  className="ms-1"
                  variant="danger"
                >
                  Delete
                </Button>
              );
          }
        }

        return (
          <Button onClick={buttonProps?.onClick} className="ms-1">
            {buttonProps?.label}
          </Button>
        );
      },
      renderField: (fieldDropdownProps) => (
        <div style={{ width: "100%" }}>
          <SelectField
            name={fieldDropdownProps?.id ?? ""}
            options={[]}
            className={`flex-grow-1 me-2 ps-0`}
            removeLabel={true}
          />
        </div>
      ),
      showNot: false,
      canRegroup: true,
      canReorder: true
    }
  };

  const [state, setState] = useState({
    tree: QbUtils.checkTree(QbUtils.loadTree(queryValue), config),
    config
  });

  // Placeholder for now.
  const onChange = () => {
    return true;
  };

  const renderBuilder = useCallback(
    (props: BuilderProps) => (
      <div className="query-builder-container" style={{ padding: "10px" }}>
        <div className="query-builder qb-lite">
          <Builder {...props} />
        </div>
      </div>
    ),
    []
  );

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

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const cacheId = useMemo(() => uuidv4(), []);

  const {
    data,
    error: indexError,
    isValidating: loading
  } = useSWR<ESIndexMapping[], any>(
    [indexName, cacheId],
    fetchQueryFieldsByIndex,
    {
      shouldRetryOnError: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // Display loading spinner when performing request for the index.
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  // Display an error if mapping could not be retrieved.
  if (indexError) {
    return (
      <div
        className="alert alert-danger"
        style={{
          whiteSpace: "pre-line"
        }}
      >
        Could not communicate with elastic search.
      </div>
    );
  }

  const sortedData = data
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter((prop) => !prop.label.startsWith("group"));

  return (
    <>
      <Query
        {...config}
        value={state.tree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />
      <FieldArray name={name}>
        {(fieldArrayProps) => {
          const elements: [] = fieldArrayProps.form.values.queryRows;

          function addRow() {
            fieldArrayProps.push(
              <QueryRow
                name={fieldArrayProps.name}
                indexName={indexName}
                esIndexMapping={sortedData as any}
                index={elements?.length ?? 0}
                removeRow={removeRow}
                addRow={addRow}
              />
            );
            // initialize the logic switch value to be "and"
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
                  indexName={indexName}
                  key={index}
                  index={index}
                  addRow={addRow}
                  removeRow={removeRow}
                  esIndexMapping={sortedData as any}
                />
              ))
            : null;
        }}
      </FieldArray>
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField
          isMulti={true}
          name="group"
          className="col-md-4"
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
