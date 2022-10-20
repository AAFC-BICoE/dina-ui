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
