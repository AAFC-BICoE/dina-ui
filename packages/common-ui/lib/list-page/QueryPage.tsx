import { useLocalStorage, writeStorage } from "@rehooks/local-storage";
import { ColumnSort, Row, SortingState } from "@tanstack/react-table";
import { FormikContextType } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import _ from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  CSSProperties
} from "react";
import {
  ImmutableTree,
  JsonTree,
  Utils
} from "@react-awesome-query-builder/ui";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useIntl } from "react-intl";
import { v4 as uuidv4 } from "uuid";
import {
  ColumnSelectorMemo,
  FormikButton,
  ReactTable,
  ReactTableProps,
  useAccount
} from "..";
import { useApiClient } from "../api-client/ApiClientContext";
import { DinaForm, DinaFormSection } from "../formik-connected/DinaForm";
import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { CommonMessage } from "../intl/common-ui-intl";
import {
  AttachSelectedButton,
  AttachSelectedButtonProps,
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton,
  BulkSplitButton,
  DataExportButton
} from "../list-page-layout/bulk-buttons";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { MultiSortTooltip } from "./MultiSortTooltip";
import {
  QueryBuilderMemo,
  defaultJsonTree,
  defaultQueryTree,
  emptyQueryTree
} from "./query-builder/QueryBuilder";
import {
  applyGroupFilters,
  applyPagination,
  applyRootQuery,
  applySortingRules,
  applySourceFiltering,
  elasticSearchFormatExport,
  processResults
} from "./query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import {
  CustomViewField,
  useQueryBuilderConfig
} from "./query-builder/useQueryBuilderConfig";
import { DynamicFieldsMappingConfig, TableColumn } from "./types";
import { useSessionStorage } from "usehooks-ts";
import {
  ValidationError,
  getElasticSearchValidationResults
} from "./query-builder/query-builder-elastic-search/QueryBuilderElasticSearchValidator";
import { MemoizedReactTable } from "./QueryPageTable";
import { GroupSelectFieldMemoized } from "./QueryGroupSelection";
import { useRouter } from "next/router";
import {
  parseQueryTreeFromURL,
  serializeQueryTreeToURL
} from "./query-url/queryUtils";
import {
  createLastUsedSavedSearchChangedKey,
  createSessionStorageLastUsedTreeKey
} from "./saved-searches/SavedSearch";

const DEFAULT_PAGE_SIZE: number = 25;
const DEFAULT_SORT: SortingState = [
  {
    id: "createdOn",
    desc: true
  }
];

/**
 * Elastic search by default will only count up to 10,000 records. If the search returns 10,000
 * as the page size, there is a good chance that there is more and the /count endpoint will need
 * to be used to get the actual total.
 */
const MAX_COUNT_SIZE: number = 10000;

/**
 * Generates a consistent storage key for a component's group filter.
 *
 * @param indexName - A unique identifier for the component or page,
 *                    e.g., "material-sample-list".
 * @returns The formatted storage key string, e.g., "dina-material-sample-index_groupStorage".
 */
export const getGroupStorageKey = (indexName: string): string => {
  if (!indexName) {
    console.error("getGroupStorageKey was called with an empty indexName.");
    return "indexName";
  }

  return `${indexName}_groupStorage`;
};

export interface QueryPageProps<TData extends KitsuResource> {
  /**
   * Columns to render on the table. This will also be used to map the data to a specific column.
   *
   * If the column selector is being used, this is the default columns to be shown for new users.
   */
  columns: TableColumn<TData>[];

  /**
   * Used for the listing page to understand which columns can be provided. Filters are generated
   * based on the index provided.
   *
   * Also used to store saved searches under a specific type:
   *
   * `UserPreference.savedSearches.[INDEX_NAME].[SAVED_SEARCH_NAME]`
   *
   * For example, to get the default saved searches for the material sample index:
   * `UserPreference.savedSearches.dina_material_sample_index.default.filters`
   */
  indexName: string;

  /**
   * Used for generating the local storage keys. Every instance of the QueryPage should have it's
   * own unique name.
   *
   * In special cases where you want the sorting, pagination, column selection and other features
   * to remain the same across tables, it can share the same name.
   */
  uniqueName: string;

  /**
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;

  /**
   * This will add an option to the QueryBuilder to allow users to check if a relationship exists.
   */
  enableRelationshipPresence?: boolean;

  /**
   * Array of relationshipType columns to be excluded from the dropdown menu
   */
  excludedRelationshipTypes?: string[];

  /**
   * IDs of the columns that should always be displayed and cannot be deleted.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   *
   * Used for the column selector.
   */
  mandatoryDisplayedColumns?: string[];

  /**
   * IDs of the columns that will not be shown in the export field list.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   *
   * Used for the column selector.
   */
  nonExportableColumns?: string[];

  /**
   * IDs of the columns that should not be displayed in the Query Builder field selector.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   *
   * Used for the column selector.
   */
  nonSearchableColumns?: string[];

  /**
   * By default, the QueryPage will try sorting using `createdOn` attribute. You can override this
   * setting by providing your own default sort.
   */
  defaultSort?: SortingState;

  /**
   * By default, the page size is 25 (25 items can be displayed per page). If you set this to zero
   * the page size will not be applied to the elastic search query.
   */
  defaultPageSize?: number;

  /**
   * Adds the bulk edit button and the row checkboxes.
   *
   * The query path to perform for bulk editing.
   */
  bulkEditPath?: string;

  /**
   * Adds the data export button.
   */
  dataExportProps?: { dataExportPath: string; entityLink: string };

  /** Query path if user selected only 1 item */
  singleEditPath?: string;

  /** Adds the bulk delete button and the row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;

  attachSelectedButtonsProps?: AttachSelectedButtonProps;

  /**
   * Router path to perform the split from, all of the ids are moved over using local storage.
   */
  bulkSplitPath?: string;

  reactTableProps?:
    | Partial<ReactTableProps<TData>>
    | ((
        responseData: PersistedResource<TData>[] | undefined,
        CheckBoxField: React.ComponentType<CheckBoxFieldProps<TData>>
      ) => Partial<ReactTableProps<TData>>);

  /**
   * When enabled, the user will see the results table with a selection table.
   *
   * QueryBuilder and Saved Searches will appear as normal.
   *
   * Bulk editing mode is disabled in this mode.
   */
  selectionMode?: boolean;

  /**
   * If selection mode is enabled, this must be set.
   *
   * Outside of the QueryPage, a react state must be setup to hold the resources that have been
   * selected.
   *
   * These are the currently selected resources which will be displayed on the right table of the
   * selection mode QueryPage.
   */
  selectionResources?: TData[];

  /**
   * If selection mode is enabled, this must be set.
   *
   * This will be used to set selection mode resources using the ">>" or "<<" options.
   */
  setSelectionResources?: React.Dispatch<React.SetStateAction<TData[]>>;

  /**
   * Event prop triggered when the user changes the sort settings.
   *
   * @param SortingRule[] rules for sorting. Contains the id (column name) and
   *        sorting order.
   */
  onSortedChange?: (newSort: SortingState) => void;

  /**
   * Event when user select data from left to the right table
   * @param selectedData
   * @returns
   */
  onSelect?: (selectedData: TData[]) => void;

  /**
   * Event when user remove data from the right table.
   * @param deselectedData
   * @returns
   */
  onDeselect?: (deselectedData: TData[]) => void;

  /**
   * Boolean flag to display the QueryPage in view mode (no query builder and search bar).
   */
  viewMode?: boolean;

  /**
   * Custom query builder tree used to generate into elastic search.
   */
  customViewQuery?: JsonTree;

  /**
   * When using the custom query builder, should the groups be filtered by the logged in users
   * assigned groups?
   */
  customViewFilterGroups?: boolean;

  /**
   * Custom elastic search query to use.
   */
  customViewElasticSearchQuery?: any;

  /**
   * Required if view mode is enabled. This is used to provide the fields into the Query Builder
   * configuration which is required for generating the elastic search query.
   */
  customViewFields?: CustomViewField[];

  /**
   * Styling to be applied to each row of the React Table
   */
  rowStyling?: (row: Row<TData>) => CSSProperties | undefined;

  enableDnd?: boolean;

  /**
   * Display the column selector, this will display all the same columns from the QueryBuilder.
   *
   * Default is true.
   */
  enableColumnSelector?: boolean;
}

/**
 * Top level component for displaying an elastic-search listing page.
 *
 * The following features are supported with the QueryPage:
 *
 * * Pagination
 * * Sorting
 * * Filtering using ElasticSearch Indexing
 * * Saved Searches
 * * Column Selector
 */
export function QueryPage<TData extends KitsuResource>({
  indexName,
  uniqueName,
  dynamicFieldMapping,
  enableRelationshipPresence = false,
  excludedRelationshipTypes,
  mandatoryDisplayedColumns,
  nonExportableColumns,
  nonSearchableColumns,
  columns,
  bulkDeleteButtonProps,
  attachSelectedButtonsProps,
  bulkEditPath,
  bulkSplitPath,
  singleEditPath,
  dataExportProps,
  reactTableProps,
  defaultSort,
  defaultPageSize,
  selectionMode = false,
  selectionResources: selectedResources,
  setSelectionResources: setSelectedResources,
  onSortedChange,
  viewMode,
  customViewQuery,
  customViewFilterGroups = true,
  customViewElasticSearchQuery,
  customViewFields,
  rowStyling,
  enableDnd = false,
  onSelect,
  onDeselect,
  enableColumnSelector = true
}: QueryPageProps<TData>) {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [columnSelectorLoading, setColumnSelectorLoading] =
    useState<boolean>(true);
  const { apiClient } = useApiClient();
  const { formatMessage, formatNumber } = useIntl();
  const { groupNames } = useAccount();
  const isActionTriggeredQuery = useRef(false);
  const router = useRouter();

  // Search results returned by Elastic Search
  const [searchResults, setSearchResults] = useState<TData[]>([]);
  const [elasticSearchQuery, setElasticSearchQuery] = useState();

  // Total number of records from the query. This is not the total displayed on the screen.
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Columns to be displayed on the table, if column selector is used this can be anything. Default
  // is the columns prop if not being used.
  const [displayedColumns, setDisplayedColumns] = useState<
    TableColumn<TData>[]
  >([]);

  // User applied sorting rules for elastic search to use.
  const localStorageLastUsedSortKey = uniqueName + "-last-used-sort";
  const [sortingRules, setSortingRules] = useLocalStorage<ColumnSort[]>(
    localStorageLastUsedSortKey,
    defaultSort ?? DEFAULT_SORT
  );

  // The pagination size.
  const localStorageLastUsedPageSizeKey = uniqueName + "-last-used-page-size";
  const [pageSize, setPageSize] = useLocalStorage<number>(
    localStorageLastUsedPageSizeKey,
    defaultPageSize ?? DEFAULT_PAGE_SIZE
  );

  // The pagination offset.
  const localStorageLastUsedPageOffsetKey =
    uniqueName + "-last-used-page-offset";
  const [pageOffset, setPageOffset] = useLocalStorage<number>(
    localStorageLastUsedPageOffsetKey,
    0
  );

  // State to store the query tree generated by the Query Builder. This tree is used to store the
  // current values, not the submitted tree.
  const [queryBuilderTree, setQueryBuilderTree] = useState<ImmutableTree>(
    defaultQueryTree()
  );

  // The submitted query builder tree. If this changes, a search should be performed.
  const [submittedQueryBuilderTree, setSubmittedQueryBuilderTree] =
    useState<ImmutableTree>(defaultQueryTree());

  // The query builder configuration.
  const { queryBuilderConfig, indexMap } = useQueryBuilderConfig({
    indexName,
    dynamicFieldMapping,
    enableRelationshipPresence,
    customViewFields,
    nonSearchableColumns
  });

  // Groups selected for the search.
  const GROUP_STORAGE_KEY = getGroupStorageKey(uniqueName);
  const [groups, setGroups] = useLocalStorage<string[]>(
    GROUP_STORAGE_KEY,
    groupNames ?? []
  );

  // Row Checkbox Toggle
  const showRowCheckboxes = Boolean(
    bulkDeleteButtonProps ||
      bulkEditPath ||
      dataExportProps ||
      attachSelectedButtonsProps
  );

  // Query Page error message state
  const [error, setError] = useState<any>();

  // Query page validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState(false);

  const defaultGroups = useMemo(() => {
    return { group: groups };
  }, [groups]);

  const [_sessionStorageQueryTree, setSessionStorageQueryTree] =
    useSessionStorage<JsonTree>(
      createSessionStorageLastUsedTreeKey(uniqueName),
      defaultJsonTree
    );

  /** If column selector is not being used, just load the default columns in. */
  useEffect(() => {
    if (!enableColumnSelector) {
      setDisplayedColumns(columns);
    }
  }, [enableColumnSelector]);

  useEffect(() => {
    if (viewMode && selectedResources?.length !== undefined) {
      setTotalRecords(selectedResources?.length);
      setLoading(false);
    }
  }, [viewMode, selectedResources]);

  // Determine validation errors after each tree change.
  useEffect(() => {
    // Query builder is not setup yet.
    if (!queryBuilderConfig) {
      return;
    }

    // Custom validation logic.
    if (!customViewElasticSearchQuery) {
      const validationErrorsFound = getElasticSearchValidationResults(
        queryBuilderTree,
        queryBuilderConfig,
        formatMessage
      );

      setValidationErrors(validationErrorsFound);
    }
  }, [queryBuilderTree]);

  // Fetch data if the pagination, sorting or search filters have changed.
  useEffect(() => {
    // If in view mode with selected resources, no requests need to be made.
    if (viewMode && selectedResources?.length !== undefined) {
      setLoading(false);
      return;
    }

    // Reset any error messages since we are trying again.
    setError(undefined);

    // Query builder is not setup yet.
    if (!submittedQueryBuilderTree || !queryBuilderConfig) {
      return;
    }

    // Check the tree for any validation issues. Do not submit query if issues exist.
    if (!Utils.isValidTree(submittedQueryBuilderTree, queryBuilderConfig)) {
      return;
    }

    // Custom validation logic.
    if (!customViewElasticSearchQuery) {
      const validationErrorsFound = getElasticSearchValidationResults(
        submittedQueryBuilderTree,
        queryBuilderConfig,
        formatMessage
      );
      setValidationErrors(validationErrorsFound);

      // If any errors are found, do not continue with the search.
      if (validationErrorsFound.length > 0) {
        return;
      }
    }

    // Ensure displayedColumns has been loaded in.
    if (displayedColumns.length === 0) {
      return;
    }

    // Elastic search query with pagination settings.
    let queryDSL;
    if (viewMode) {
      isActionTriggeredQuery.current = true;
    } else {
      queryDSL = elasticSearchFormatExport(
        submittedQueryBuilderTree,
        queryBuilderConfig
      );
    }

    const combinedColumns = _.uniqBy([...columns, ...displayedColumns], "id");

    queryDSL = applyRootQuery(queryDSL, customViewElasticSearchQuery);

    // Custom queries should not be adding the group.
    if (!viewMode && customViewFilterGroups) {
      queryDSL = applyGroupFilters(queryDSL, groups);
    }

    queryDSL = applyPagination(queryDSL, pageSize, pageOffset);
    queryDSL = applySortingRules(queryDSL, sortingRules, combinedColumns);
    queryDSL = applySourceFiltering(queryDSL, combinedColumns);

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!queryDSL || !Object.keys(queryDSL).length) {
      return;
    }

    // Save elastic search query for export page
    setElasticSearchQuery({ ...queryDSL });

    if (isActionTriggeredQuery.current === true) {
      isActionTriggeredQuery.current = false;
      setLoading(true);

      // Fetch data using elastic search.
      // The included section will be transformed from an array to an object with the type name for each relationship.
      elasticSearchRequest(queryDSL)
        .then((result) => {
          const processedResult = processResults(result);

          // If we have reached the count limit, we will need to perform another request for the true
          // query size.
          if (result?.total.value === MAX_COUNT_SIZE) {
            elasticSearchCountRequest(queryDSL)
              .then((countResult) => {
                setTotalRecords(countResult);
              })
              .catch((elasticSearchError) => {
                setError(elasticSearchError);
              });
          } else {
            setTotalRecords(result?.total?.value ?? 0);
          }

          setAvailableResources(processedResult);
          setSearchResults(processedResult);
        })
        .catch((elasticSearchError) => {
          setError(elasticSearchError);
        })
        .finally(() => {
          // No matter the end result, loading should stop.
          setLoading(false);
        });
    }
  }, [
    pageSize,
    pageOffset,
    sortingRules,
    submittedQueryBuilderTree,
    groups,
    displayedColumns,
    customViewElasticSearchQuery
  ]);

  // Once the configuration is setup, we can display change the tree.
  useEffect(() => {
    if (queryBuilderConfig) {
      isActionTriggeredQuery.current = true;
      if (viewMode) {
        if (customViewQuery) {
          const newTree = Utils.loadTree(customViewQuery);
          setSubmittedQueryBuilderTree(newTree);
          setQueryBuilderTree(newTree);
        } else if (customViewElasticSearchQuery && !enableColumnSelector) {
          setSubmittedQueryBuilderTree(emptyQueryTree());
          setQueryBuilderTree(emptyQueryTree());
        }
      }
      if (router?.query?.queryTree) {
        const parsedQueryTree = parseQueryTreeFromURL(
          router.query.queryTree as string
        );
        if (parsedQueryTree) {
          setQueryBuilderTree(parsedQueryTree);
          setSubmittedQueryBuilderTree(parsedQueryTree);
          setSessionStorageQueryTree(Utils.getTree(parsedQueryTree));
        }
      }
    }
  }, [
    queryBuilderConfig,
    customViewQuery,
    customViewFields,
    customViewElasticSearchQuery,
    router?.query?.queryTree
  ]);

  // If column selector is disabled, the loading spinner should be turned off.
  useEffect(() => {
    if (!enableColumnSelector) {
      setColumnSelectorLoading(false);
    }
  }, [enableColumnSelector]);

  /**
   * Used for selection mode only.
   *
   * Takes all of the checked items from the search results, and moves them to the right table to
   * mark them as selected.
   *
   * @param formValues Current form values.
   * @param formik Formik Context
   */
  function moveSelectedResultsToSelectedResources(
    formValues,
    formik: FormikContextType<any>
  ) {
    isActionTriggeredQuery.current = true;
    // Ensure selectedResources has been setup correctly.
    if (!selectedResources || !setSelectedResources) {
      console.error(
        "selectionResources and setSelectionResources states must be passed to QueryPage in order to Selection Mode."
      );
      return;
    }

    const itemIdsToSelect = formValues.itemIdsToSelect;

    const ids = _.toPairs(itemIdsToSelect)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    const selectedObjects = searchResults.filter((itemA) => {
      return ids.find((itemB) => {
        return itemA.id === itemB;
      });
    });

    // Append the newly selected resources with the current resources.
    const selectedResourcesAppended = _.uniqBy(
      [...selectedResources, ...selectedObjects],
      "id"
    );

    onSelect?.(selectedObjects);
    setSelectedResources(selectedResourcesAppended);
    setRemovableItems(selectedResourcesAppended);

    // Deselect the search results.
    formik.setFieldValue("itemIdsToSelect", {});
  }

  /**
   * Used for selection mode only.
   *
   * Removes the selected resources checked.
   *
   * @param formValues Current form values.
   * @param formik Formik Context
   */
  function removeSelectedResources(formValues, formik: FormikContextType<any>) {
    isActionTriggeredQuery.current = true;
    // Ensure selectedResources has been setup correctly.
    if (!selectedResources || !setSelectedResources) {
      console.error(
        "selectionResources and setSelectionResources states must be passed to QueryPage in order to Selection Mode."
      );
      return;
    }

    const itemIdsToDelete = formValues.itemIdsToDelete;

    const ids = _.toPairs(itemIdsToDelete)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    const unselectedObjects = selectedResources.filter((itemA) => {
      return !ids.find((itemB) => {
        return itemA.id === itemB;
      });
    });

    onDeselect?.(unselectedObjects);
    setRemovableItems(unselectedObjects);
    setSelectedResources(unselectedObjects);
    formik.setFieldValue("itemIdsToDelete", {});
  }

  /**
   * Asynchronous POST request for elastic search. Used to retrieve elastic search results against
   * the indexName in the prop.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
  async function elasticSearchRequest(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.hits;
  }

  /**
   * Asynchronous POST request for elastic search count API. By default, the elastic search will
   * only provide the count until `MAX_COUNT_SIZE`. This call is used to get the accurate total
   * count for larger search sets.
   *
   * @param queryDSL query filters are only used, pagination and sorting are ignored.
   * @returns Elastic search count response.
   */
  async function elasticSearchCountRequest(queryDSL) {
    const query = { query: { ...queryDSL?.query } };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/count`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.count;
  }

  // Checkbox for the first table that lists the search results
  const {
    CheckBoxField: SelectCheckBox,
    CheckBoxHeader: SelectCheckBoxHeader,
    setAvailableItems: setAvailableResources
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToSelect",
    defaultAvailableItems: searchResults ?? []
  });

  // Checkbox for second table where selected/to be deleted items are displayed
  const {
    CheckBoxField: DeselectCheckBox,
    CheckBoxHeader: DeselectCheckBoxHeader,
    setAvailableItems: setRemovableItems
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToDelete",
    defaultAvailableItems: selectedResources ?? []
  });

  const computedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(
          searchResults as PersistedResource<TData>[],
          SelectCheckBox
        )
      : reactTableProps;

  const resolvedReactTableProps: Partial<ReactTableProps<TData>> = {
    sort: sortingRules,
    ...computedReactTableProps
  };

  // Columns generated for the search results.
  const columnsResults = useMemo(() => {
    const showSelectColumn = showRowCheckboxes || selectionMode;

    const selectColumn = showSelectColumn
      ? [
          {
            id: "selectColumn",
            cell: ({ row: { original: resource } }) => (
              <SelectCheckBox key={resource.id} resource={resource} />
            ),
            header: () => <SelectCheckBoxHeader />,
            enableSorting: false,
            size: 50
          }
        ]
      : [];

    return _.uniqBy([...selectColumn, ...displayedColumns], "id");
  }, [showRowCheckboxes, selectionMode, displayedColumns, searchResults]);

  // Columns generated for the selected resources, only in selection mode.
  const columnsSelected: TableColumn<TData>[] = [
    ...(selectionMode
      ? [
          {
            id: "columnSelected",
            cell: ({ row: { original: resource } }) => (
              <DeselectCheckBox key={resource.id} resource={resource} />
            ),
            header: () => <DeselectCheckBoxHeader />,
            enableSorting: false,
            size: 50
          }
        ]
      : []),
    ...columns
  ];

  /**
   * Reset the search filters to a blank state. Errors are also cleared since a new filter is being
   * performed.
   */
  const onReset = useCallback(() => {
    isActionTriggeredQuery.current = true;
    setSubmittedQueryBuilderTree(defaultQueryTree());
    setQueryBuilderTree(defaultQueryTree());
    setSessionStorageQueryTree(defaultJsonTree);
    writeStorage(createLastUsedSavedSearchChangedKey(uniqueName), false);
    setSortingRules(defaultSort ?? DEFAULT_SORT);
    setError(undefined);
    setPageOffset(0);

    // Reset the query to empty.
    router.push(
      {
        pathname: router.pathname,
        query: null
      },
      undefined,
      { shallow: true }
    );
  }, []);

  /**
   * On search filter submit. This will also update the pagination to go back to the first page on
   * a new search.
   */
  const onSubmit = () => {
    isActionTriggeredQuery.current = true;
    setSubmittedQueryBuilderTree(queryBuilderTree);
    setPageOffset(0);
    setSessionStorageQueryTree(Utils.getTree(queryBuilderTree));
  };

  /**
   * When the group filter has changed, store the new value for the search.
   */
  const onGroupChange = useCallback((newGroups: string[]) => {
    isActionTriggeredQuery.current = true;
    setGroups(newGroups);
  }, []);

  /**
   * When the displayed columns are changed from the column selector, we need to trigger
   * a new elastic search query since the _source changes.
   *
   * Elasticsearch query is not regenerated if the order only changed since we still have all
   * the fields required.
   */
  const onDisplayedColumnsChange = useCallback(
    (newDisplayedColumns: TableColumn<TData>[]) => {
      // Check if order has changed (ignoring different items)
      const orderChanged =
        displayedColumns.length === newDisplayedColumns.length;

      // Update the flag based on order change
      if (displayedColumns.length !== 0) {
        isActionTriggeredQuery.current = !orderChanged;
      }

      // Update displayedColumns regardless of order change
      setDisplayedColumns(newDisplayedColumns);
    },
    [displayedColumns] // Only re-render if displayedColumns changes
  );

  /**
   * When the query builder tree has changed, store the new tree here.
   */
  const onQueryBuildTreeChange = useCallback((newTree: ImmutableTree) => {
    setQueryBuilderTree(newTree);
  }, []);

  /**
   * When the user changes the react-table page size, it will trigger this event.
   *
   * This method will update the pagination, and since we have a useEffect hook on the pagination
   * this will trigger a new search. This will update the pagination limit.
   *
   * @param newPageSize
   */
  const onPageSizeChanged = useCallback((newPageSize: number) => {
    isActionTriggeredQuery.current = true;
    setPageOffset(0);
    setPageSize(newPageSize);
    setLoading(true);
  }, []);

  /**
   * When the user changes the react-table page sort, it will trigger this event.
   *
   * This method will cause the useEffect with the search to trigger if the sorting has changed.
   */
  const onSortChange = useCallback((newSort: ColumnSort[]) => {
    isActionTriggeredQuery.current = true;
    setSortingRules(newSort);
    setLoading(true);

    // Trigger the prop event listener.
    onSortedChange?.(newSort);
  }, []);

  /**
   * When the user changes the react-table page, it will trigger this event.
   *
   * This method will update the pagination, and since we have a useEffect hook on the pagination
   * this will trigger a new search. Using the page size we can determine the offset.
   *
   * For example:
   *    pageSize: 25
   *    newPage: 5
   *
   *    The offset would be 25 * 5 = 125.
   *
   * @param newPage
   */
  const onPageChanged = useCallback(
    (newPage: number) => {
      isActionTriggeredQuery.current = true;
      setPageOffset(pageSize * newPage);
      setLoading(true);
    },
    [pageSize]
  );

  function onRowMove(draggedRowIndex: number, targetRowIndex: number) {
    isActionTriggeredQuery.current = true;
    if (!!selectedResources) {
      selectedResources.splice(
        targetRowIndex,
        0,
        selectedResources.splice(draggedRowIndex, 1)[0] as TData
      );
      if (!!setSelectedResources) {
        setSelectedResources([...selectedResources]);
      }
    }
  }

  async function onCopyToClipboard() {
    const serializedTree = serializeQueryTreeToURL(queryBuilderTree);

    const query =
      serializedTree !== null
        ? `?queryTree=${encodeURIComponent(serializedTree)}`
        : "";
    const fullUrl = `${window.location.origin}${router.pathname}${query}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  }

  // Generate the key for the DINA form. It should only be generated once.
  const formKey = useMemo(() => uuidv4(), []);

  return (
    <>
      {!viewMode && (
        <>
          {validationErrors.length > 0 && (
            <div
              className="alert alert-danger"
              style={{
                whiteSpace: "pre-line"
              }}
            >
              <h5>Validation Errors</h5>
              <ul>
                {validationErrors.map((validationError: ValidationError) => (
                  <li key={validationError.fieldName}>
                    <strong>{validationError.fieldName}: </strong>
                    {validationError.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <QueryBuilderMemo
            onCopyToClipboard={onCopyToClipboard}
            indexName={indexName}
            queryBuilderTree={queryBuilderTree}
            setQueryBuilderTree={onQueryBuildTreeChange}
            queryBuilderConfig={queryBuilderConfig}
            setSubmittedQueryBuilderTree={setSubmittedQueryBuilderTree}
            setPageOffset={setPageOffset}
            onSubmit={onSubmit}
            onReset={onReset}
            setGroups={setGroups}
            groups={groups}
            uniqueName={uniqueName}
            validationErrors={validationErrors}
            triggerSearch={isActionTriggeredQuery}
          />
        </>
      )}

      <DinaForm key={formKey} initialValues={defaultGroups} onSubmit={onSubmit}>
        {/* Group Selection */}
        {!viewMode ? (
          <DinaFormSection horizontal={"flex"}>
            <div className="row">
              <GroupSelectFieldMemoized
                isMulti={true}
                name="group"
                className="col-md-4 mt-3"
                onChange={onGroupChange}
                groups={groups}
              />
              {/* Bulk edit buttons - Only shown when not in selection mode. */}
              {!selectionMode && (
                <div className="col-md-8 mt-3 d-flex gap-2 justify-content-end align-items-start">
                  {enableColumnSelector && (
                    <ColumnSelectorMemo
                      uniqueName={uniqueName}
                      exportMode={false}
                      indexMapping={indexMap}
                      dynamicFieldsMappingConfig={dynamicFieldMapping}
                      displayedColumns={displayedColumns as any}
                      setDisplayedColumns={onDisplayedColumnsChange as any}
                      defaultColumns={columns as any}
                      setColumnSelectorLoading={setColumnSelectorLoading}
                      excludedRelationshipTypes={excludedRelationshipTypes}
                      mandatoryDisplayedColumns={mandatoryDisplayedColumns}
                      nonExportableColumns={nonExportableColumns}
                    />
                  )}
                  {bulkEditPath && (
                    <BulkEditButton
                      pathname={bulkEditPath}
                      singleEditPathName={singleEditPath}
                    />
                  )}
                  {bulkDeleteButtonProps && (
                    <BulkDeleteButton {...bulkDeleteButtonProps} />
                  )}
                  {dataExportProps && (
                    <DataExportButton
                      pathname={dataExportProps.dataExportPath}
                      entityLink={dataExportProps.entityLink}
                      totalRecords={totalRecords}
                      query={elasticSearchQuery}
                      uniqueName={uniqueName}
                      columns={columns}
                      dynamicFieldMapping={dynamicFieldMapping}
                      indexName={indexName}
                    />
                  )}
                  {bulkSplitPath && (
                    <BulkSplitButton pathname={bulkSplitPath} />
                  )}
                  {attachSelectedButtonsProps && (
                    <AttachSelectedButton {...attachSelectedButtonsProps} />
                  )}
                </div>
              )}
            </div>
          </DinaFormSection>
        ) : (
          <DinaFormSection horizontal={"flex"}>
            <div className="row">
              {/* Bulk edit buttons - Only shown when not in selection mode. */}
              {!selectionMode && (
                <div className="col-md-12 mt-3 d-flex gap-2 justify-content-end align-items-start">
                  {enableColumnSelector && (
                    <ColumnSelectorMemo
                      uniqueName={uniqueName}
                      exportMode={false}
                      indexMapping={indexMap}
                      displayedColumns={displayedColumns as any}
                      setDisplayedColumns={onDisplayedColumnsChange as any}
                      defaultColumns={columns as any}
                      setColumnSelectorLoading={setColumnSelectorLoading}
                      dynamicFieldsMappingConfig={dynamicFieldMapping}
                      excludedRelationshipTypes={excludedRelationshipTypes}
                      mandatoryDisplayedColumns={mandatoryDisplayedColumns}
                      nonExportableColumns={nonExportableColumns}
                    />
                  )}
                </div>
              )}
            </div>
          </DinaFormSection>
        )}

        <div
          className="query-table-wrapper"
          role="search"
          aria-label={formatMessage({ id: "queryTable" })}
        >
          <div className="row">
            <div className={selectionMode ? "col-5" : "col-12"}>
              <div className="d-flex align-items-end">
                <span id="queryPageCount">
                  {/* Loading indicator when total is not calculated yet. */}
                  {loading || columnSelectorLoading ? (
                    <></>
                  ) : (
                    <CommonMessage
                      id="tableTotalCount"
                      values={{ totalCount: formatNumber(totalRecords) }}
                    />
                  )}
                </span>

                {/* Multi sort tooltip - Only shown if it's possible to sort */}
                {resolvedReactTableProps.enableMultiSort && (
                  <MultiSortTooltip />
                )}
              </div>
              {error && (
                <div
                  className="alert alert-danger"
                  style={{
                    whiteSpace: "pre-line"
                  }}
                >
                  <p>
                    {error.errors?.map((e) => e.detail).join("\n") ??
                      String(error)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const newSort = defaultSort ?? DEFAULT_SORT;
                      setError(undefined);
                      onSortChange(newSort);
                    }}
                  >
                    <CommonMessage id="resetSort" />
                  </button>
                </div>
              )}
              {loading || columnSelectorLoading ? (
                <div
                  className={
                    "d-flex justify-content-center align-items-center h-100 query-page-loading-spinner " +
                    (isFullScreen ? "fullscreen" : "")
                  }
                >
                  <LoadingSpinner loading={true} />
                </div>
              ) : (
                <MemoizedReactTable
                  // Column and data props
                  columns={columnsResults as any}
                  data={
                    (viewMode
                      ? customViewFields
                        ? searchResults
                        : selectedResources
                      : searchResults) ?? []
                  }
                  // Loading Table props
                  loading={loading || columnSelectorLoading}
                  // Pagination props
                  manualPagination={
                    viewMode && selectedResources?.length ? false : true
                  }
                  pageSize={pageSize}
                  pageCount={
                    totalRecords ? Math.ceil(totalRecords / pageSize) : 0
                  }
                  page={pageOffset / pageSize}
                  onPageChange={onPageChanged}
                  onPageSizeChange={onPageSizeChanged}
                  // Sorting props
                  manualSorting={
                    viewMode && selectedResources?.length ? false : true
                  }
                  onSortingChange={onSortChange}
                  sort={sortingRules}
                  // Table customization props
                  {...resolvedReactTableProps}
                  className="-striped react-table-overflow"
                  rowStyling={rowStyling}
                  showPagination={true}
                  showPaginationTop={true}
                  smallPaginationButtons={selectionMode}
                  enableFullscreen={true}
                  isFullscreen={isFullScreen}
                  setIsFullscreen={setIsFullScreen}
                />
              )}
              <div className="mt-2">
                {/* Loading indicator when total is not calculated yet. */}
                {loading || columnSelectorLoading ? (
                  <></>
                ) : (
                  <CommonMessage
                    id="tableTotalCount"
                    values={{ totalCount: formatNumber(totalRecords) }}
                  />
                )}
              </div>
            </div>
            {selectionMode && (
              <>
                <div className="col-2 mt-5">
                  <div className="select-all-checked-button">
                    <FormikButton
                      className="btn btn-primary w-100 mb-5"
                      onClick={moveSelectedResultsToSelectedResources}
                    >
                      <div data-testid="move-resources-over">
                        <FiChevronRight />
                      </div>
                    </FormikButton>
                  </div>
                  <div className="deselect-all-checked-button">
                    <FormikButton
                      className="btn btn-dark w-100 mb-5"
                      onClick={removeSelectedResources}
                    >
                      <div data-testid="remove-resources">
                        <FiChevronLeft />
                      </div>
                    </FormikButton>
                  </div>
                </div>
                <div className="col-5">
                  <span id="selectedResourceCount">
                    <CommonMessage
                      id="tableSelectedCount"
                      values={{ totalCount: selectedResources?.length ?? 0 }}
                    />
                  </span>
                  <ReactTable<TData>
                    loading={loading}
                    columns={columnsSelected}
                    data={selectedResources ?? []}
                    onRowMove={onRowMove}
                    enableDnd={enableDnd}
                    enableSorting={!enableDnd}
                    showPagination={!enableDnd}
                    manualPagination={true}
                    smallPaginationButtons={true}
                    enableFullscreen={true}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </DinaForm>
    </>
  );
}
