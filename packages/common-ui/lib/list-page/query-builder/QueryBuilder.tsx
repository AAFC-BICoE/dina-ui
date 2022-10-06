import { useCallback, useEffect, useState } from "react";
import {
  Builder,
  BuilderProps,
  Config,
  ImmutableTree,
  Query,
  Utils
} from "react-awesome-query-builder";
import { LoadingSpinner } from "../..";
import { useQueryBuilderConfig } from "./useQueryBuilderConfig";

export interface UseQueryBuilderProps {
  indexName: string;
  viewMode: boolean;
}

export function QueryBuilder({ indexName, viewMode }: UseQueryBuilderProps) {
  // Load the query build configuration.
  const { queryBuilderConfig } = useQueryBuilderConfig(indexName, viewMode);

  // State to store the query tree generated by the Query Builder. This tree is used to store the
  // current values, not the submitted tree.
  const [queryBuilderTree, setQueryBuilderTree] = useState<ImmutableTree>(
    defaultQueryTree()
  );

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

  if (!queryBuilderConfig || !queryBuilderTree) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <Query
      {...queryBuilderConfig}
      value={queryBuilderTree}
      onChange={onChange}
      renderBuilder={renderBuilder}
    />
  );
}

/**
 * Empty query tree, used as the default when loading the page.
 */
export function defaultQueryTree(): ImmutableTree {
  const parentUUID = Utils.uuid();
  const childUUID = Utils.uuid();

  return Utils.loadTree({
    id: parentUUID,
    type: "group",
    children1: {
      [childUUID]: {
        type: "rule",
        properties: {
          field: null,
          operator: null,
          value: [],
          valueSrc: [],
          valueType: []
        }
      }
    }
  });
}
