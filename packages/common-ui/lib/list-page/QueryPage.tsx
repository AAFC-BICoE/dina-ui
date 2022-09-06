import { FilterParam, KitsuResource, PersistedResource } from "kitsu";
import { useState } from "react";
import { useIntl } from "react-intl";
import ReactTable, { TableProps, SortingRule } from "react-table";
import { useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "./QueryBuilder";
import { DefaultTBody } from "../table/QueryTable";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import {
  transformQueryToDSL,
  TransformQueryToDSLParams
} from "../util/transformToDSL";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "../list-page-layout/bulk-buttons";
import { CommonMessage } from "../intl/common-ui-intl";
import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { v4 as uuidv4 } from "uuid";
import { SavedSearch } from "./SavedSearch";
import { MultiSortTooltip } from "./MultiSortTooltip";
import { cloneDeep, uniq, toPairs } from "lodash";
import { FormikButton, LimitOffsetPageSpec, useAccount } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { useEffect } from "react";
import { UserPreference } from "packages/dina-ui/types/user-api/resources/UserPreference";
import { TableColumn } from "./types";
import { FormikContextType } from "formik";

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
   * By default, the QueryPage will try sorting using `createdOn` attribute. You can override this
   * setting by providing your own default sort.
   */
  defaultSort?: SortingRule[];

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
 */
export function QueryPage<TData extends KitsuResource>({
  indexName,
  columns,
  bulkDeleteButtonProps,
  bulkEditPath,
  singleEditPath,
  reactTableProps,
  defaultSort,
  selectionMode = false,
  selectionResources: selectedResources,
  setSelectionResources: setSelectedResources,
  onSortedChange,
  viewMode
}: QueryPageProps<TData>) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();
  const { groupNames, subject } = useAccount();

  // Search results returned by Elastic Search
  const [searchResults, setSearchResults] = useState<TData[]>([]);

  // Total number of records from the query. This is not the total displayed on the screen.
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Search filters for elastic search to apply.
  const [searchFilters, setSearchFilters] = useState<TransformQueryToDSLParams>(
    {
      group: groupNames?.[0] ?? "",
      queryRows: [
        {
          fieldName: ""
        }
      ]
    }
  );

  // User applied sorting rules for elastic search to use.
  const [sortingRules, setSortingRules] = useState(defaultSort ?? DEFAULT_SORT);

  // User applied pagination rules for elastic search to use.
  const [pagination, setPagination] = useState<LimitOffsetPageSpec>({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  });

  // Row Checkbox Toggle
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // Users saved preferences.
  const [userPreferences, setUserPreferences] = useState<UserPreference>();

  // When the user uses the "load" button, the selected saved search is saved here.
  const [loadedSavedSearch, setLoadedSavedSearch] = useState<string>();

  // Loading state
  const [loading, setLoading] = useState<boolean>(true);

  // Query Page error message state
  const [error, setError] = useState<any>();

  // Fetch data if the pagination, sorting or search filters have changed.
  useEffect(() => {
    // Reset any error messages since we are trying again.
    setError(undefined);

    // Elastic search query with pagination settings.
    const queryDSL = transformQueryToDSL(
      pagination,
      columns,
      sortingRules,
      cloneDeep(searchFilters)
    );

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!queryDSL || !Object.keys(queryDSL).length) return;

    // Fetch data using elastic search.
    // The included section will be transformed from an array to an object with the type name for each relationship.
    elasticSearchRequest(queryDSL)
      .then((result) => {
        const processedResult = result?.hits.map((rslt) => ({
          id: rslt._source?.data?.id,
          type: rslt._source?.data?.type,
          data: {
            attributes: rslt._source?.data?.attributes
          },
          included: rslt._source?.included?.reduce(
            (array, currentIncluded) => (
              (array[currentIncluded?.type] = currentIncluded), array
            ),
            {}
          )
        }));
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
  }, [pagination, searchFilters, sortingRules]);

  // Actions to perform when the QueryPage is first mounted.
  useEffect(() => {
    loadSavedSearch("default");
  }, []);

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
    const selectedResourcesAppended = uniq([
      ...selectedResources,
      ...selectedObjects
    ]);

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
   * Using the user preferences, load the saved search name into the search filters.
   *
   * @param savedSearchName The name of the saved search to load.
   * @param applyFilters boolean to indicate if it should just set the loadedSavedSearch without applying the filters.
   * @returns
   */
  function loadSavedSearch(savedSearchName: string) {
    if (!savedSearchName) return;

    // Reload the user preferences incase they have changed.
    retrieveUserPreferences((userPreference) => {
      setLoadedSavedSearch(savedSearchName);

      // User preference must be returned.
      if (!userPreference) return;

      // Ensure that the user preference exists, if not do not load anything.
      const loadedOption =
        userPreference?.savedSearches?.[indexName]?.[savedSearchName];
      if (loadedOption) {
        setLoading(true);
        setSearchFilters(loadedOption);
        setPagination({
          ...pagination,
          offset: 0
        });
      }
    });
  }

  /**
   * Retrieve the user preference for the logged in user. This is used for the SavedSearch
   * functionality since the saved searches are stored in the user preferences.
   */
  async function retrieveUserPreferences(
    callback: (userPreference?: UserPreference) => void
  ) {
    // Retrieve user preferences...
    await apiClient
      .get<UserPreference[]>("user-api/user-preference", {
        filter: {
          userId: subject as FilterParam
        }
      })
      .then((response) => {
        // Set the user preferences to be a state for the QueryPage.
        setUserPreferences(response?.data?.[0]);
        callback(response?.data?.[0]);
      })
      .catch((userPreferenceError) => {
        setError(userPreferenceError);
        callback(undefined);
      });
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
    fieldName: "itemIdsToDelete"
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
  const columnsSelected: TableColumn<TData>[] = selectionMode
    ? [
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
      ]
    : [];

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
   *
   * @param formik formik instance, used to set the current form to empty.
   */
  function resetForm(formik) {
    const resetToVal = {
      queryRows: [{}],
      group: groupNames?.[0]
    };
    formik?.setValues(resetToVal);
    setError(undefined);
    onSubmit({ submittedValues: resetToVal });
  }

  /**
   * On search filter submit. This will also update the pagination to go back to the first page on
   * a new search.
   *
   * @param submittedValues search filter form values.
   */
  const onSubmit = ({ submittedValues }) => {
    setSearchFilters(submittedValues);
    setPagination({
      ...pagination,
      offset: 0
    });
    setLoading(true);
  };

  /**
   * When the user changes the react-table page size, it will trigger this event.
   *
   * This method will update the pagination, and since we have a useEffect hook on the pagination
   * this will trigger a new search. This will update the pagination limit.
   *
   * @param newPageSize
   */
  function onPageSizeChange(newPageSize: number) {
    setPagination({
      offset: 0,
      limit: newPageSize
    });
    setLoading(true);
  }

  /**
   * When the user changes the react-table page sort, it will trigger this event.
   *
   * This method will cause the useEffect with the search to trigger if the sorting has changed.
   */
  function onSortChange(newSort: SortingRule[]) {
    setSortingRules(newSort);
    setLoading(true);

    // Trigger the prop event listener.
    onSortedChange?.(newSort);
  }

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
  function onPageChange(newPage: number) {
    setPagination({
      ...pagination,
      offset: pagination.limit * newPage
    });
    setLoading(true);
  }

  return (
    <DinaForm key={uuidv4()} initialValues={searchFilters} onSubmit={onSubmit}>
      {!viewMode && (
        <label
          style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
        >
          <DinaMessage id="search" />
        </label>
      )}

      {/* Query Filtering Options */}
      {!viewMode && (
        <QueryBuilder
          name="queryRows"
          indexName={indexName}
          onGroupChange={onSubmit}
        />
      )}

      <div className="d-flex mb-3">
        {!viewMode && (
          <div className="flex-grow-1">
            {/* Saved Searches */}
            <label className="group-field d-flex gap-2 align-items-center mb-2">
              <div className="field-label">
                <strong>Saved Searches</strong>
              </div>
              <div className="flex-grow-1">
                <SavedSearch
                  indexName={indexName}
                  userPreferences={cloneDeep(userPreferences)}
                  loadedSavedSearch={loadedSavedSearch}
                  loadSavedSearch={loadSavedSearch}
                />
              </div>
            </label>
          </div>
        )}
        {!viewMode && (
          <div>
            {/* Action Buttons */}
            <SubmitButton>{formatMessage({ id: "search" })}</SubmitButton>
            <FormikButton
              className="btn btn-secondary mx-2"
              onClick={(_, formik) => resetForm(formik)}
            >
              <DinaMessage id="resetFilters" />
            </FormikButton>
          </div>
        )}
      </div>

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
                    values={{ totalCount: totalRecords }}
                  />
                )}
              </span>

              {/* Multi sort tooltip - Only shown if it's possible to sort */}
              {resolvedReactTableProps?.sortable !== false && (
                <MultiSortTooltip />
              )}

              {/* Bulk edit buttons - Only shown when not in selection mode. */}
              {!selectionMode && (
                <div className="d-flex gap-3 mb-2">
                  {bulkEditPath && (
                    <BulkEditButton
                      pathname={bulkEditPath}
                      singleEditPathName={singleEditPath}
                    />
                  )}
                  {bulkDeleteButtonProps && (
                    <BulkDeleteButton {...bulkDeleteButtonProps} />
                  )}
                </div>
              )}
            </div>
            <ReactTable
              // Column and data props
              columns={mappedResultsColumns}
              data={searchResults}
              minRows={1}
              // Loading Table props
              loading={loading}
              // Pagination props
              manual={true}
              pageSize={pagination.limit}
              pages={
                totalRecords ? Math.ceil(totalRecords / pagination.limit) : 0
              }
              page={pagination.offset / pagination.limit}
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
              className="-striped"
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
                    <FiChevronsRight />
                  </FormikButton>
                </div>
                <div className="deselect-all-checked-button">
                  <FormikButton
                    className="btn btn-dark w-100 mb-5"
                    onClick={removeSelectedResources}
                  >
                    <FiChevronsLeft />
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
  );
}
