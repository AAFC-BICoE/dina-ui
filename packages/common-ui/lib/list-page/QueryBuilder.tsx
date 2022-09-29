import {
  DinaFormSection,
  FieldWrapperProps,
  LoadingSpinner,
  useApiClient
} from "..";
import { GroupSelectField } from "../../../dina-ui/components";
import { useEffect, useMemo } from "react";
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
import { FaTrash } from "react-icons/fa";
import { QueryFieldSelector } from "./QueryFieldSelector";
import { QueryOperatorSelector } from "./QueryOperatorSelector";
import QueryRowTextSearch from "./query-row-search-options/QueryRowTextSearch";
import { QueryConjunctionSwitch } from "./QueryConjunctionSwitch";

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

  // State to store the index map after it has been retrieved.
  const [indexMap, setIndexMap] = useState<ESIndexMapping[]>([]);

  // Query Builder Configuration, only needs to update if the index map has changed.
  const config: Config = useMemo(
    () => ({
      // "AND"/"OR" conjunctions configuration.
      conjunctions: {
        ...BasicConfig.conjunctions
      },

      // All the possible operators.
      operators: {
        equals: {
          label: "Equals"
        },
        notEquals: {
          label: "Not equals"
        },
        empty: {
          label: "Empty"
        },
        notEmpty: {
          label: "Not empty"
        },
        greaterThan: {
          label: "Greater than"
        },
        greaterThanOrEqualTo: {
          label: "Greater than or equal to"
        },
        lessThan: {
          label: "Less than"
        },
        lessThanOrEqualTo: {
          label: "Less than or equal to"
        },
        contains: {
          label: "Contains"
        }
      },

      // Each type has a custom widget to display, these are defined here.
      widgets: {
        text: {
          type: "text",
          factory: (factoryProps) => (
            <QueryRowTextSearch
              matchType={factoryProps?.operator}
              value={factoryProps?.value}
              setValue={factoryProps?.setValue}
            />
          ),
          formatValue: (val, _fieldDef, _wgtDef, isForDisplay) =>
            isForDisplay ? val.toString() : JSON.stringify(val)
        }
      },

      // All of the possible types from the index mapping. These are attached to widgets.
      // The possible operators are also defined here for each type.
      types: {
        text: {
          defaultOperator: "equals",
          widgets: {
            text: {
              operators: ["equals", "notEquals", "empty", "notEmpty"]
            }
          }
        },
        autoComplete: {
          defaultOperator: "equals",
          widgets: {
            autoComplete: {
              operators: ["equals", "notEquals", "empty", "notEmpty"]
            }
          }
        },
        date: {
          defaultOperator: "equals",
          widgets: {
            date: {
              operators: [
                "equals",
                "notEquals",
                "contains",
                "greaterThan",
                "greaterThanOrEquals",
                "lessThan",
                "lessThanOrEquals",
                "empty",
                "notEmpty"
              ]
            }
          }
        },
        number: {
          defaultOperator: "equals",
          widgets: {
            number: {
              operators: [
                "equals",
                "notEquals",
                "greaterThan",
                "greaterThanOrEquals",
                "lessThan",
                "lessThanOrEquals",
                "empty",
                "notEmpty"
              ]
            }
          }
        },
        boolean: {
          defaultOperator: "equals",
          widgets: {
            boolean: {
              operators: ["equals", "empty", "notEmpty"]
            }
          }
        }
      },

      // All of the possible fields, indicates the type for each field item.
      fields: {
        "data.attributes.createdBy": {
          label: "test",
          type: "text"
        }
      },

      // Query Builder Library settings.
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
                    <FaTrash />
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
          <QueryFieldSelector
            indexMap={indexMap}
            setField={fieldDropdownProps?.setField}
          />
        ),
        renderOperator: (operatorDropdownProps) => (
          <QueryOperatorSelector
            options={operatorDropdownProps?.items}
            setField={operatorDropdownProps?.setField}
          />
        ),
        renderConjs: (conjunctionProps) => (
          <QueryConjunctionSwitch
            currentConjunction={conjunctionProps?.selectedConjunction}
            setConjunction={conjunctionProps?.setConjunction}
          />
        ),
        showNot: false,
        canRegroup: true,
        canReorder: true
      }
    }),
    [indexMap]
  );

  // State to store the query tree generated by the Query Builder.
  const [queryTree, setQueryTree] = useState<ImmutableTree>(
    QbUtils.checkTree(
      QbUtils.loadTree({
        id: QbUtils.uuid(),
        type: "group"
      }),
      config
    )
  );

  const onChange = useCallback((immutableTree: ImmutableTree) => {
    setQueryTree(immutableTree);
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
  }, []);

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
  if (!indexMap) {
    return <LoadingSpinner loading={true} />;
  }

  const sortedData = indexMap
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter((prop) => !prop.label.startsWith("group"));

  return (
    <>
      <Query
        {...config}
        value={queryTree}
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
