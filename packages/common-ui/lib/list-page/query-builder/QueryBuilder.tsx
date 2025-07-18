import { LoadingSpinner } from "../..";
import { createContext, useCallback, useContext, useState } from "react";
import {
  Config,
  ImmutableTree,
  BuilderProps,
  Query,
  Builder,
  Utils,
  JsonTree
} from "@react-awesome-query-builder/ui";
import React from "react";
import { Button } from "react-bootstrap";
import { SavedSearch } from "../saved-searches/SavedSearch";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { CommonMessage } from "common-ui";
import { ValidationError } from "./query-builder-elastic-search/QueryBuilderElasticSearchValidator";

export interface QueryBuilderContextI {
  performSubmit: () => void;
  groups: string[];
}

const QueryBuilderContext = createContext<QueryBuilderContextI | null>(null);

export const QueryBuilderContextProvider = QueryBuilderContext.Provider;

/** Exposes the needed features from the query page provider. */
export function useQueryBuilderContext(
  throwOnMissing = true
): QueryBuilderContextI | null {
  const ctx = useContext(QueryBuilderContext);
  if (!ctx) {
    if (!throwOnMissing) {
      return null;
    }
    throw new Error(
      "No QueryBuilderContext available, is this component inside of a QueryPage?"
    );
  }
  return ctx;
}

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

  /**
   * Set the submitted query builder tree, used to to load a saved search.
   */
  setSubmittedQueryBuilderTree: React.Dispatch<
    React.SetStateAction<ImmutableTree>
  >;

  /**
   * Set the page offset, used to to load a saved search.
   */
  setPageOffset: React.Dispatch<React.SetStateAction<number>>;

  /**
   * Current groups being applied to the search.
   */
  groups: string[];

  /**
   * Set the groups to be loaded, used for the saved search.
   */
  setGroups: React.Dispatch<React.SetStateAction<string[]>>;

  /**
   * Used for generating the local storage keys. Every instance of the QueryPage should have it's
   * own unique name.
   *
   * In special cases where you want the sorting, pagination, column selection and other features
   * to remain the same across tables, it can share the same name.
   */
  uniqueName: string;

  /**
   * Validation errors reported. This should disable the "Search" button to prevent the user from
   * submitting a broken query.
   */
  validationErrors: ValidationError[];

  // Reference for triggering the search. This helps prevent more searches than necessary.
  triggerSearch: React.MutableRefObject<boolean>;

  // Callback function to handle copying URL with query filters to clipboard
  onCopyToClipboard: () => Promise<void>;
}

function QueryBuilder({
  indexName,
  queryBuilderConfig,
  queryBuilderTree,
  setQueryBuilderTree,
  onSubmit,
  onReset,
  setSubmittedQueryBuilderTree,
  setPageOffset,
  groups,
  setGroups,
  uniqueName,
  validationErrors,
  triggerSearch,
  onCopyToClipboard
}: QueryBuilderProps) {
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);
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
      <QueryBuilderContextProvider
        value={{ performSubmit: onSubmit, groups: groups ?? [] }}
      >
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
          setSubmittedQueryBuilderTree={setSubmittedQueryBuilderTree}
          performSubmit={onSubmit}
          setPageOffset={setPageOffset}
          groups={groups}
          setGroups={setGroups}
          uniqueName={uniqueName}
          triggerSearch={triggerSearch}
          copiedToClipboard={copiedToClipboard}
          setCopiedToClipboard={setCopiedToClipboard}
          onCopyToClipboard={async () => {
            await onCopyToClipboard();
            setCopiedToClipboard(true);
          }}
        />
        <Query
          {...queryBuilderConfig}
          value={queryBuilderTree}
          onChange={onChange}
          renderBuilder={renderBuilder}
        />
        <div className="mt-2">
          <Button
            onClick={onSubmit}
            className="me-2"
            disabled={validationErrors.length > 0}
          >
            <DinaMessage id="search" />
          </Button>
          <Button
            onClick={() => {
              onReset();
              setCopiedToClipboard(false);
            }}
            variant="secondary"
            className="me-2"
          >
            <CommonMessage id="resetButtonText" />
          </Button>
        </div>
      </QueryBuilderContextProvider>
    </>
  );
}

const groupId = "8c6dc2c8-4070-48ce-b700-13a931f9ebaf";
const ruleId = "f76a54f6-0112-4ac9-b2a1-f6dced58b3d6";
export const defaultJsonTree = {
  id: groupId,
  type: "group",
  children1: [
    {
      type: "rule",
      id: ruleId,
      properties: {
        field: null,
        operator: null,
        value: [],
        valueSrc: [],
        valueError: []
      }
    }
  ],
  properties: { conjunction: "AND" },
  path: [groupId]
} as JsonTree;
/**
 * Default query tree contains an empty rule so it's one less the step the user needs to perform.
 *
 * This is the default when first loading the page and resetting the query builder.
 */
export function defaultQueryTree(): ImmutableTree {
  return Utils.loadTree(defaultJsonTree);
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
    children1: [
      {
        type: "rule",
        properties: {
          field: path,
          operator: "uuid",
          value: [uuid]
        }
      }
    ]
  };
}

export const QueryBuilderMemo = React.memo(QueryBuilder);
