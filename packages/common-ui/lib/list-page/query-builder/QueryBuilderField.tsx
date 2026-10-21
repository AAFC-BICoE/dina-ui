import {
  ImmutableTree,
  JsonTree,
  Utils
} from "@react-awesome-query-builder/ui";
import { useField } from "formik";
import { useCallback, useRef, useState } from "react";
import { useApiClient } from "../../api-client/ApiClientContext";
import { useDinaFormContext } from "../../formik-connected/DinaForm";
import { CommonMessage } from "../../intl/common-ui-intl";
import { LoadingSpinner } from "../../loading-spinner/LoadingSpinner";
import { serializeQueryTreeToURL } from "../query-url/queryUtils";
import { DynamicFieldsMappingConfig } from "../types";
import { defaultQueryTree, QueryBuilderMemo } from "./QueryBuilder";
import {
  applyRootQuery,
  elasticSearchFormatExport
} from "./query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { ValidationError } from "./query-builder-elastic-search/QueryBuilderElasticSearchValidator";
import { useQueryBuilderConfig } from "./useQueryBuilderConfig";

export interface QueryBuilderFieldProps {
  /** The formik field the query builder tree (JsonTree) is stored under. */
  name: string;

  /** The Elasticsearch index the query is built against. */
  indexName: string;

  /**
   * Tells the query builder where dynamic fields (managed attributes, field
   * extensions, identifiers, etc.) can be searched.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;

  /** Adds an option to search for the presence of a relationship. */
  enableRelationshipPresence?: boolean;

  /**
   * Page the "copy query link" action should point at. Defaults to the current
   * page.
   */
  copyQueryLinkPath?: string;
}

const NO_VALIDATION_ERRORS: ValidationError[] = [];

/** The embedded builder manages its own tree, so pagination is ignored. */
const ignorePageOffset = () => undefined;

/** Loads the stored tree, falling back to an empty one for missing/invalid values. */
function loadQueryTree(value?: JsonTree): ImmutableTree {
  try {
    return value ? Utils.loadTree(value) : defaultQueryTree();
  } catch {
    return defaultQueryTree();
  }
}

/** True if any rule in the tree has a field selected. */
function treeHasSelectedField(tree: ImmutableTree): boolean {
  const children = tree.get("children1");
  if (!children || children.size === 0) {
    return false;
  }
  return children.some((child: ImmutableTree) =>
    child.get("type") === "group"
      ? treeHasSelectedField(child)
      : Boolean(child.getIn(["properties", "field"]))
  );
}

/** Blank trees are stored as undefined so an unused query isn't persisted. */
function toFormValue(tree: ImmutableTree): JsonTree | undefined {
  return treeHasSelectedField(tree)
    ? (Utils.getTree(tree) as JsonTree)
    : undefined;
}

/**
 * Formik-connected curated query builder. Reuses the same Elasticsearch query
 * builder as the list pages and embeds it in a form, storing the query builder
 * tree (a JsonTree) as the field value so it can be saved on the resource.
 *
 * The Search button runs the query and shows how many records it matches.
 */
export function QueryBuilderField(props: QueryBuilderFieldProps) {
  const { readOnly } = useDinaFormContext();

  return readOnly ? (
    <QueryBuilderFieldReadOnly name={props.name} />
  ) : (
    <QueryBuilderFieldEditor {...props} />
  );
}

/** View mode: display the stored query tree as JSON. */
function QueryBuilderFieldReadOnly({ name }: { name: string }) {
  const [field] = useField<JsonTree | undefined>(name);

  if (!field.value) {
    return null;
  }

  return (
    <pre className="mb-0" style={{ maxHeight: "400px", overflow: "auto" }}>
      {JSON.stringify(field.value, null, 2)}
    </pre>
  );
}

function QueryBuilderFieldEditor({
  name,
  indexName,
  dynamicFieldMapping,
  enableRelationshipPresence,
  copyQueryLinkPath
}: QueryBuilderFieldProps) {
  const { apiClient } = useApiClient();
  const [field, , helpers] = useField<JsonTree | undefined>(name);

  const { queryBuilderConfig } = useQueryBuilderConfig({
    indexName,
    dynamicFieldMapping,
    enableRelationshipPresence
  });

  // The query builder works with an ImmutableTree; the form stores a JsonTree.
  const [tree, setTree] = useState<ImmutableTree>(() =>
    loadQueryTree(field.value)
  );
  const [, setSubmittedTree] = useState<ImmutableTree>(defaultQueryTree());
  const [groups, setGroups] = useState<string[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>();
  const triggerSearch = useRef(false);

  // Track the latest tree so a freshly loaded saved search isn't overwritten by
  // a stale value when the submit callback fires.
  const latestTree = useRef(tree);

  const onTreeChange = useCallback(
    (newTree: ImmutableTree) => {
      latestTree.current = newTree;
      setTree(newTree);
      helpers.setValue(toFormValue(newTree));
      helpers.setTouched(true);
      // The previous count no longer matches the edited query.
      setTotalRecords(undefined);
    },
    [helpers]
  );

  /** Runs the count request for the current tree. */
  const runCount = useCallback(async () => {
    const currentTree = latestTree.current;
    if (!queryBuilderConfig || !treeHasSelectedField(currentTree)) {
      setTotalRecords(undefined);
      return;
    }

    try {
      const generatedQuery = elasticSearchFormatExport(
        currentTree,
        queryBuilderConfig
      );
      // The builder returns the bare `bool` clause; the count endpoint expects
      // it wrapped under `query`.
      const queryDSL = applyRootQuery(generatedQuery, undefined);

      // Incomplete queries generate nothing, so don't report a misleading count.
      if (!queryDSL?.query) {
        setTotalRecords(undefined);
        return;
      }

      const response = await apiClient.axios.post(
        "search-api/search-ws/count",
        { query: { ...queryDSL.query } },
        { params: { indexName } }
      );
      setTotalRecords(response?.data?.count);
    } catch (error) {
      console.error(error);
      setTotalRecords(undefined);
    }
  }, [apiClient, indexName, queryBuilderConfig]);

  const commitTree = useCallback(() => {
    const currentTree = latestTree.current;
    setSubmittedTree(currentTree);
    helpers.setValue(toFormValue(currentTree));
    helpers.setTouched(true);
    runCount();
  }, [helpers, runCount]);

  const resetTree = useCallback(() => {
    const emptyTree = defaultQueryTree();
    latestTree.current = emptyTree;
    setTree(emptyTree);
    setSubmittedTree(emptyTree);
    helpers.setValue(undefined);
    helpers.setTouched(true);
    setTotalRecords(undefined);
  }, [helpers]);

  const onCopyToClipboard = useCallback(async () => {
    const serializedTree = serializeQueryTreeToURL(latestTree.current);
    const query =
      serializedTree !== null
        ? `?queryTree=${encodeURIComponent(serializedTree)}`
        : "";
    const path = copyQueryLinkPath ?? window.location.pathname;
    const fullUrl = `${window.location.origin}${path}${query}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  }, [copyQueryLinkPath]);

  if (!queryBuilderConfig) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <>
      <QueryBuilderMemo
        indexName={indexName}
        queryBuilderConfig={queryBuilderConfig}
        queryBuilderTree={tree}
        setQueryBuilderTree={onTreeChange}
        onSubmit={commitTree}
        onReset={resetTree}
        setSubmittedQueryBuilderTree={setSubmittedTree}
        setPageOffset={ignorePageOffset}
        groups={groups}
        setGroups={setGroups}
        uniqueName={`${indexName}-dataset-query`}
        validationErrors={NO_VALIDATION_ERRORS}
        triggerSearch={triggerSearch}
        onCopyToClipboard={onCopyToClipboard}
        showHeading={false}
        autoLoadSavedSearch={false}
      />
      {totalRecords !== undefined && (
        <div className="mt-2" aria-live="polite">
          <CommonMessage
            id="tableTotalCount"
            values={{ totalCount: totalRecords }}
          />
        </div>
      )}
    </>
  );
}
