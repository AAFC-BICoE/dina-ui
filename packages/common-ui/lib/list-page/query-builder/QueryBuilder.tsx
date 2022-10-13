import { LoadingSpinner } from "../..";
import { Query, Builder, Utils, JsonTree } from "react-awesome-query-builder";
import { useCallback } from "react";
import {
  Config,
  ImmutableTree,
  BuilderProps
} from "react-awesome-query-builder";
import React from "react";
import { Button } from "react-bootstrap";

interface QueryBuilderProps {
  /**
   * Query Builder Configuration.
   */
  queryBuilderConfig?: Config;

  /**
   * Query Builder local tree.
   */
  queryBuilderTree?: ImmutableTree;

  /**
   * Callback function to indicate that the query builder has changed.
   */
  setQueryBuilderTree: (newTree: ImmutableTree) => void;

  /**
   * Callback function to indicate the form was submitted.
   */
  onSubmit: () => void;

  /**
   * Callback to indicate the query builder was reset.
   */
  onReset: () => void;
}

function QueryBuilder({
  queryBuilderConfig,
  queryBuilderTree,
  setQueryBuilderTree,
  onSubmit,
  onReset
}: QueryBuilderProps) {
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

  // Display loading spinner when performing request for the index.
  if (!queryBuilderTree || !queryBuilderConfig) {
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
      <div className="mt-2">
        <Button onClick={onSubmit} className="me-2">
          Search
        </Button>
        <Button onClick={onReset} variant="secondary">
          Reset
        </Button>
      </div>
    </>
  );
}

/**
 * Empty query tree, used as the default when loading the page.
 */
export function defaultQueryTree(config: Config): ImmutableTree {
  return Utils.checkTree(
    Utils.loadTree({
      id: "baabbba8-0123-4456-b89a-b183d17aa81f",
      type: "group",
      children1: {
        "9b8889bb-4567-489a-bcde-f183d18abfc3": {
          type: "rule",
          id: "9b8889bb-4567-489a-bcde-f183d18abfc3",
          properties: {
            field: null,
            operator: null,
            value: [],
            valueSrc: [],
            valueError: []
          },
          path: [
            "baabbba8-0123-4456-b89a-b183d17aa81f",
            "9b8889bb-4567-489a-bcde-f183d18abfc3"
          ]
        }
      },
      properties: { conjunction: "AND" },
      path: ["baabbba8-0123-4456-b89a-b183d17aa81f"]
    } as JsonTree),
    config
  );
}

/**
 * Generate an empty tree, used for resetting.
 */
export function emptyQueryTree(): ImmutableTree {
  return Utils.loadTree({
    id: "baabbba8-0123-4456-b89a-b183d17aa81f",
    type: "group",
    children1: {}
  } as JsonTree);
}

export function generateUUIDTree(uuid: string, path: string): JsonTree {
  return {
    id: Utils.uuid(),
    type: "group",
    children1: {
      [Utils.uuid()]: {
        type: "rule",
        properties: {
          field: path,
          operator: "uuid",
          value: [uuid]
        }
      }
    }
  };
}

/**
 * Traverses through the Query Builder tree to find any validation errors.
 *
 * @param tree The query builder tree.
 * @returns true if validation error found, false if no errors are found.
 */
export function checkForErrorsInTree(tree: ImmutableTree) {
  const type = tree.get("type");
  const children = tree.get("children1");
  const properties = tree.get("properties") || new Map();

  if (type === "rule" && properties) {
    const errors = properties.get("valueError");
    return typeof errors === "string";
  }

  if ((type === "group" || type === "rule_group") && children) {
    // If there is nothing in the group, then don't add it to the query.
    if (!children || !children.size) return undefined;
    const childrenArray = children.valueSeq().toArray();
    return childrenArray.map((childTree) => checkForErrorsInTree(childTree));
  }
}

export const QueryBuilderMemo = React.memo(QueryBuilder);
