import { LoadingSpinner } from "../..";
import { Query, Builder, Utils } from "react-awesome-query-builder";
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

export const QueryBuilderMemo = React.memo(QueryBuilder);
