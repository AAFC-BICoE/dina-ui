import { useCallback } from "react";
import {
  Builder,
  BuilderProps,
  ImmutableTree,
  Query,
  Utils
} from "react-awesome-query-builder";
import { Button } from "react-bootstrap";
import { LoadingSpinner } from "../..";
import { useRecoilState } from "recoil";
import { queryTreeState, queryConfigState } from "../recoil_state";

export function QueryBuilder() {
  const [queryTree, setQueryTree] = useRecoilState(queryTreeState);
  const [queryConfig] = useRecoilState(queryConfigState);

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

  if (!queryConfig) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <>
      <Query
        {...queryConfig}
        value={queryTree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />
      <Button>Search</Button>
    </>
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
