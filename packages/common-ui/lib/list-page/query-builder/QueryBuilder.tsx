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
import { SavedSearch } from "../saved-searches/SavedSearch";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

interface QueryBuilderProps {
  /**
   * Index name being used for the QueryPage.
   */
  indexName: string;

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
  indexName,
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
      <label
        style={{
          fontSize: 20,
          fontFamily: "sans-serif",
          fontWeight: "bold"
        }}
        className="mb-2"
      >
        <DinaMessage id="search" />
      </label>
      <SavedSearch
        indexName={indexName}
        queryBuilderTree={queryBuilderTree}
        setQueryBuilderTree={setQueryBuilderTree}
        queryBuilderConfig={queryBuilderConfig}
        performSubmit={onSubmit}
      />
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
 * Default query tree contains an empty rule so it's one less the step the user needs to perform.
 *
 * This is the default when first loading the page and resetting the query builder.
 */
export function defaultQueryTree(): ImmutableTree {
  const groupId = "8c6dc2c8-4070-48ce-b700-13a931f9ebaf";
  const ruleId = "f76a54f6-0112-4ac9-b2a1-f6dced58b3d6";

  return Utils.loadTree({
    id: groupId,
    type: "group",
    children1: {
      "f76a54f6-0112-4ac9-b2a1-f6dced58b3d6": {
        type: "rule",
        id: ruleId,
        properties: {
          field: null,
          operator: null,
          value: [],
          valueSrc: [],
          valueError: []
        },
        path: [groupId, ruleId]
      }
    },
    properties: { conjunction: "AND" },
    path: [groupId]
  } as JsonTree);
}

/**
 * Generate an empty tree with no rules. Used for special cases like custom elastic search
 * view queries where the query builder is not needed.
 */
export function emptyQueryTree(): ImmutableTree {
  return Utils.loadTree({
    id: Utils.uuid(),
    type: "group",
    children1: {}
  } as JsonTree);
}

/**
 * Currently utilized for the custom view queries to show associated records.
 *
 * @param uuid UUID to search for.
 * @param path Relationship path to search against.
 * @returns QueryBuilder tree which will be translated into elastic search query.
 */
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

export const QueryBuilderMemo = React.memo(QueryBuilder);
