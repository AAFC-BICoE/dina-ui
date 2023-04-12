import { KitsuResource, PersistedResource } from "kitsu";
import { useCallback, useState } from "react";
import { useIntl } from "react-intl";
import ReactTable, { TableProps, SortingRule } from "react-table";
import { useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm, DinaFormSection } from "../formik-connected/DinaForm";
import {
  defaultQueryTree,
  emptyQueryTree,
  QueryBuilderMemo
} from "./query-builder/QueryBuilder";
import { DefaultTBody } from "../table/QueryTable";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton,
  BulkSplitButton
} from "../list-page-layout/bulk-buttons";
import { CommonMessage } from "../intl/common-ui-intl";
import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { v4 as uuidv4 } from "uuid";
import { MultiSortTooltip } from "./MultiSortTooltip";
import { toPairs, uniqBy } from "lodash";
import { FormikButton, useAccount } from "..";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { useEffect } from "react";
import { DynamicFieldsMappingConfig, TableColumn } from "./types";
import { FormikContextType } from "formik";
import { ImmutableTree, JsonTree, Utils } from "react-awesome-query-builder";
import {
  applyGroupFilters,
  applyPagination,
  applyRootQuery,
  applySortingRules,
  applySourceFiltering,
  elasticSearchFormatExport
} from "./query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import {
  CustomViewField,
  useQueryBuilderConfig
} from "./query-builder/useQueryBuilderConfig";
import React from "react";
import { GroupSelectField } from "../../../dina-ui/components";
import { useMemo } from "react";
import { useLocalStorage } from "@rehooks/local-storage";

const DEFAULT_PAGE_SIZE: number = 25;
const DEFAULT_SORT: SortingRule[] = [
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

export interface QueryPageProps<TData extends KitsuResource> {
  /**
   * Columns to render on the table. This will also be used to map the data to a specific column.
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
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;

  /**
   * By default, the QueryPage will try sorting using `createdOn` attribute. You can override this
   * setting by providing your own default sort.
   */
  defaultSort?: SortingRule[];

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

  /** Query path if user selected only 1 item */
  singleEditPath?: string;

  /** Adds the bulk delete button and the row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;

  /**
   * Router path to perform the split from, all of the ids are moved over using local storage.
   */
  bulkSplitPath?: string;

  reactTableProps?:
    | Partial<TableProps>
    | ((
        responseData: PersistedResource<TData>[] | undefined,
        CheckBoxField: React.ComponentType<CheckBoxFieldProps<TData>>
      ) => Partial<TableProps>);

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
  onSortedChange?: (newSort: SortingRule[]) => void;

  /**
   * Boolean flag to display only the result table when true
   */
  viewMode?: boolean;

  /**
   * Custom query builder tree used to generate into elastic search.
   */
  customViewQuery?: JsonTree;

  /**
   * Custom elastic search query to use.
   */
  customViewElasticSearchQuery?: any;

  /**
   * Required if view mode is enabled. This is used to provide the fields into the Query Builder
   * configuration which is required for generating the elastic search query.
   */
  customViewFields?: CustomViewField[];
}

const GROUP_STORAGE_KEY = "groupStorage";

/**
 * Top level component for displaying an elastic-search listing page.
 *
 * The following features are supported with the QueryPage:
 *
 * * Pagination
 * * Sorting
 * * Filtering using ElasticSearch Indexing
 * * Saved Searches
 */
export function QueryPage<TData extends KitsuResource>({
  indexName,
  dynamicFieldMapping,
  columns,
  bulkDeleteButtonProps,
  bulkEditPath,
  bulkSplitPath,
  singleEditPath,
  reactTableProps,
  defaultSort,
  defaultPageSize,
  selectionMode = false,
  selectionResources: selectedResources,
  setSelectionResources: setSelectedResources,
  onSortedChange,
  viewMode,
  customViewQuery,
  customViewElasticSearchQuery,
  customViewFields
}: QueryPageProps<TData>) {
  const { apiClient } = useApiClient();
  const { formatMessage, formatNumber } = useIntl();
  const { groupNames } = useAccount();

  // Search results returned by Elastic Search
  const [searchResults, setSearchResults] = useState<TData[]>([]);

  // Total number of records from the query. This is not the total displayed on the screen.
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // User applied sorting rules for elastic search to use.
  const [sortingRules, setSortingRules] = useState(defaultSort ?? DEFAULT_SORT);

  // The pagination size.
  const [pageSize, setPageSize] = useState<number>(
    defaultPageSize ?? DEFAULT_PAGE_SIZE
  );

  // The pagination offset.
  const [pageOffset, setPageOffset] = useState<number>(0);

  // State to store the query tree generated by the Query Builder. This tree is used to store the
  // current values, not the submitted tree.
  const [queryBuilderTree, setQueryBuilderTree] = useState<ImmutableTree>(
    defaultQueryTree()
  );

  // The submitted query builder tree. If this changes, a search should be performed.
  const [submittedQueryBuilderTree, setSubmittedQueryBuilderTree] =
    useState<ImmutableTree>(defaultQueryTree());

  // The query builder configuration.
  const { queryBuilderConfig } = useQueryBuilderConfig({
    indexName,
    dynamicFieldMapping,
    customViewFields
  });

  // Groups selected for the search.
  const [groups, setGroups] = useLocalStorage<string[]>(
    GROUP_STORAGE_KEY,
    groupNames ?? []
  );

  // Row Checkbox Toggle
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // Loading state
  const [loading, setLoading] = useState<boolean>(true);

  // Query Page error message state
  const [error, setError] = useState<any>();

  const defaultGroups = {
    group: groups
  };

  useEffect(() => {
    if (viewMode && selectedResources?.length) {
      setTotalRecords(selectedResources?.length);
    }
  }, [viewMode, selectedResources]);

  // Fetch data if the pagination, sorting or search filters have changed.
  useEffect(() => {
    // If in view mode with selected resources, no requests need to be made.
    if (viewMode && selectedResources?.length) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Reset any error messages since we are trying again.
    setError(undefined);

    // Query builder is not setup yet.
    if (!submittedQueryBuilderTree || !queryBuilderConfig) {
      setLoading(false);
      return;
    }

    // Check the tree for any validation issues. Do not submit query if issues exist.
    if (!Utils.isValidTree(submittedQueryBuilderTree)) {
      setLoading(false);
      return;
    }

    // Elastic search query with pagination settings.
    let queryDSL;

    if (customViewElasticSearchQuery) {
      queryDSL = customViewElasticSearchQuery;
    } else {
      queryDSL = elasticSearchFormatExport(
        submittedQueryBuilderTree,
        queryBuilderConfig
      );
    }

    queryDSL = applyRootQuery(queryDSL);
    queryDSL = applyGroupFilters(queryDSL, groups);
    queryDSL = applyPagination(queryDSL, pageSize, pageOffset);
    queryDSL = applySortingRules(queryDSL, sortingRules, columns);
    queryDSL = applySourceFiltering(queryDSL, columns);

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!queryDSL || !Object.keys(queryDSL).length) {
      setLoading(false);
      return;
    }

    // Fetch data using elastic search.
    // The included section will be transformed from an array to an object with the type name for each relationship.
    elasticSearchRequest(queryDSL)
      .then((result) => {
        const processedResult = result?.hits.map((rslt) => {
          return {
            id: rslt._source?.data?.id,
            type: rslt._source?.data?.type,
            data: {
              attributes: rslt._source?.data?.attributes
            },
            included: rslt._source?.included?.reduce(
              (includedAccumulator, currentIncluded) => {
                if (currentIncluded?.type === "organism") {
                  if (!includedAccumulator[currentIncluded?.type]) {
                    return (
                      (includedAccumulator[currentIncluded?.type] = [
                        currentIncluded
                      ]),
                      includedAccumulator
                    );
                  } else {
                    return (
                      includedAccumulator[currentIncluded?.type].push(
                        currentIncluded
                      ),
                      includedAccumulator
                    );
                  }
                } else {
                  return (
                    (includedAccumulator[currentIncluded?.type] =
                      currentIncluded),
                    includedAccumulator
                  );
                }
              },
              {}
            )
          };
        });
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
  }, [pageSize, pageOffset, sortingRules, submittedQueryBuilderTree, groups]);

  // Once the configuration is setup, we can display change the tree.
  useEffect(() => {
    if (queryBuilderConfig && viewMode) {
      if (customViewQuery) {
        const newTree = Utils.loadTree(customViewQuery);
        setSubmittedQueryBuilderTree(newTree);
        setQueryBuilderTree(newTree);
      } else if (customViewElasticSearchQuery) {
        setSubmittedQueryBuilderTree(emptyQueryTree());
        setQueryBuilderTree(emptyQueryTree());
      }
    }
  }, [
    queryBuilderConfig,
    customViewQuery,
    customViewFields,
    customViewElasticSearchQuery
  ]);

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
    // Ensure selectedResources has been setup correctly.
    if (!selectedResources || !setSelectedResources) {
      console.error(
        "selectionResources and setSelectionResources states must be passed to QueryPage in order to Selection Mode."
      );
      return;
    }

    const itemIdsToSelect = formValues.itemIdsToSelect;

    const ids = toPairs(itemIdsToSelect)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    const selectedObjects = searchResults.filter((itemA) => {
      return ids.find((itemB) => {
        return itemA.id === itemB;
      });
    });

    // Append the newly selected resources with the current resources.
    const selectedResourcesAppended = uniqBy(
      [...selectedResources, ...selectedObjects],
      "id"
    );

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
    // Ensure selectedResources has been setup correctly.
    if (!selectedResources || !setSelectedResources) {
      console.error(
        "selectionResources and setSelectionResources states must be passed to QueryPage in order to Selection Mode."
      );
      return;
    }

    const itemIdsToDelete = formValues.itemIdsToDelete;

    const ids = toPairs(itemIdsToDelete)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    const unselectedObjects = selectedResources.filter((itemA) => {
      return !ids.find((itemB) => {
        return itemA.id === itemB;
      });
    });

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

  const resolvedReactTableProps = { sortingRules, ...computedReactTableProps };

  // Columns generated for the search results.
  const columnsResults: TableColumn<TData>[] = [
    ...(showRowCheckboxes || selectionMode
      ? [
          {
            Cell: ({ original: resource }) => (
              <SelectCheckBox key={resource.id} resource={resource} />
            ),
            Header: SelectCheckBoxHeader,
            sortable: false,
            width: 200
          }
        ]
      : []),
    ...columns
  ];

  // Columns generated for the selected resources, only in selection mode.
  const columnsSelected: TableColumn<TData>[] = [
    ...(selectionMode
      ? [
          {
            Cell: ({ original: resource }) => (
              <DeselectCheckBox key={resource.id} resource={resource} />
            ),
            Header: DeselectCheckBoxHeader,
            sortable: false,
            width: 200
          }
        ]
      : []),
    ...columns
  ];

  const mappedResultsColumns = columnsResults.map((column) => {
    const { fieldName, customHeader } = {
      customHeader: column.Header,
      fieldName: String(column.label)
    };

    const Header = customHeader ?? <FieldHeader name={fieldName} />;

    return {
      Header,
      ...column
    };
  });

  const mappedSelectedColumns = columnsSelected.map((column) => {
    // The "columns" prop can be a string or a react-table Column type.
    const { fieldName, customHeader } = {
      customHeader: column.Header,
      fieldName: String(column.label)
    };

    const Header = customHeader ?? <FieldHeader name={fieldName} />;

    return {
      Header,
      ...column
    };
  });

  /**
   * Reset the search filters to a blank state. Errors are also cleared since a new filter is being
   * performed.
   */
  const onReset = useCallback(() => {
    setSubmittedQueryBuilderTree(defaultQueryTree());
    setQueryBuilderTree(defaultQueryTree());
    setError(undefined);
    setPageOffset(0);
  }, []);

  /**
   * On search filter submit. This will also update the pagination to go back to the first page on
   * a new search.
   */
  const onSubmit = () => {
    setSubmittedQueryBuilderTree(queryBuilderTree);
    setPageOffset(0);
  };

  /**
   * When the group filter has changed, store the new value for the search.
   */
  const onGroupChange = useCallback((newGroups: string[]) => {
    setGroups(newGroups);
  }, []);

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
  const onPageSizeChange = useCallback((newPageSize: number) => {
    setPageOffset(0);
    setPageSize(newPageSize);
    setLoading(true);
  }, []);

  /**
   * When the user changes the react-table page sort, it will trigger this event.
   *
   * This method will cause the useEffect with the search to trigger if the sorting has changed.
   */
  const onSortChange = useCallback((newSort: SortingRule[]) => {
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
  const onPageChange = useCallback(
    (newPage: number) => {
      setPageOffset(pageSize * newPage);
      setLoading(true);
    },
    [pageSize]
  );

  // Generate the key for the DINA form. It should only be generated once.
  const formKey = useMemo(() => uuidv4(), []);

  return (
    <>
      {!viewMode && (
        <QueryBuilderMemo
          indexName={indexName}
          queryBuilderTree={queryBuilderTree}
          setQueryBuilderTree={onQueryBuildTreeChange}
          queryBuilderConfig={queryBuilderConfig}
          onSubmit={onSubmit}
          onReset={onReset}
        />
      )}
      <DinaForm key={formKey} initialValues={defaultGroups} onSubmit={onSubmit}>
        {/* Group Selection */}
        {!viewMode && (
          <DinaFormSection horizontal={"flex"}>
            <div className="row">
              <GroupSelectField
                isMulti={true}
                name="group"
                className="col-md-4 mt-3"
                onChange={(newGroups) =>
                  setImmediate(() => {
                    onGroupChange(newGroups);
                  })
                }
              />
              {/* Bulk edit buttons - Only shown when not in selection mode. */}
              {!selectionMode && (
                <div className="col-md-8 mt-3 d-flex gap-2 justify-content-end align-items-start">
                  {bulkEditPath && (
                    <BulkEditButton
                      pathname={bulkEditPath}
                      singleEditPathName={singleEditPath}
                    />
                  )}
                  {bulkSplitPath && (
                    <BulkSplitButton pathname={bulkSplitPath} />
                  )}
                  {bulkDeleteButtonProps && (
                    <BulkDeleteButton {...bulkDeleteButtonProps} />
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
                  {loading ? (
                    <LoadingSpinner loading={true} />
                  ) : (
                    <CommonMessage
                      id="tableTotalCount"
                      values={{ totalCount: formatNumber(totalRecords) }}
                    />
                  )}
                </span>

                {/* Multi sort tooltip - Only shown if it's possible to sort */}
                {resolvedReactTableProps?.sortable !== false && (
                  <MultiSortTooltip />
                )}
              </div>
              <ReactTable
                // Column and data props
                columns={mappedResultsColumns}
                data={
                  viewMode
                    ? customViewFields
                      ? searchResults
                      : selectedResources
                    : searchResults
                }
                minRows={1}
                // Loading Table props
                loading={loading}
                // Pagination props
                manual={viewMode && selectedResources?.length ? false : true}
                pageSize={pageSize}
                pages={totalRecords ? Math.ceil(totalRecords / pageSize) : 0}
                page={pageOffset / pageSize}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                pageText={<CommonMessage id="page" />}
                noDataText={<CommonMessage id="noRowsFound" />}
                ofText={<CommonMessage id="of" />}
                rowsText={formatMessage({ id: "rows" })}
                previousText={<CommonMessage id="previous" />}
                nextText={<CommonMessage id="next" />}
                // Sorting props
                onSortedChange={onSortChange}
                sorted={sortingRules}
                // Table customization props
                {...resolvedReactTableProps}
                className="-striped react-table-overflow"
                TbodyComponent={
                  error
                    ? () => (
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
                      )
                    : resolvedReactTableProps?.TbodyComponent ?? DefaultTBody
                }
              />
            </div>
            {selectionMode && (
              <>
                <div className="col-2 mt-5">
                  <div className="select-all-checked-button">
                    <FormikButton
                      className="btn btn-primary w-100 mb-5"
                      onClick={moveSelectedResultsToSelectedResources}
                    >
                      <FiChevronRight />
                    </FormikButton>
                  </div>
                  <div className="deselect-all-checked-button">
                    <FormikButton
                      className="btn btn-dark w-100 mb-5"
                      onClick={removeSelectedResources}
                    >
                      <FiChevronLeft />
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
                  <ReactTable
                    columns={mappedSelectedColumns}
                    data={selectedResources}
                    minRows={1}
                    pageText={<CommonMessage id="page" />}
                    noDataText={<CommonMessage id="noRowsFound" />}
                    ofText={<CommonMessage id="of" />}
                    rowsText={formatMessage({ id: "rows" })}
                    previousText={<CommonMessage id="previous" />}
                    nextText={<CommonMessage id="next" />}
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
