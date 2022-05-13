import { KitsuResource, PersistedResource } from "kitsu";
import { useReducer } from "react";
import { useIntl } from "react-intl";
import ReactTable, { TableProps, SortingRule } from "react-table";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "./QueryBuilder";
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
import { cloneDeep } from "lodash";
import { FormikButton, LimitOffsetPageSpec, useAccount } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { useEffect } from "react";
import { UserPreference } from "packages/dina-ui/types/user-api/resources/UserPreference";
import { TableColumn } from "./types";
import { performElasticSearch } from "./performElasticSearch";

const DEFAULT_PAGE_SIZE: number = 25;
const DEFAULT_SORT: SortingRule[] = [
  {
    id: "createdOn",
    desc: true
  }
];

export type QueryPageActions =
  | { type: "PAGINATION_PAGE_CHANGE"; newPage: number }
  | { type: "PAGINATION_SIZE_CHANGE"; newSize: number }
  | { type: "SORTING_CHANGE"; newSort: SortingRule[] }
  | { type: "SEARCH_FILTER_CHANGE"; newFilter: TransformQueryToDSLParams }
  | { type: "USER_PREFERENCE_CHANGE"; newUserPreferences: UserPreference }
  | { type: "SAVED_SEARCH_CHANGE"; newSavedSearch: string }
  | { type: "LOAD_SAVED_SEARCH" }
  | { type: "SUCCESS_TABLE_DATA"; searchResults: any[]; newTotal: number }
  | { type: "ERROR"; errorLabel: string }
  | { type: "RESET" };
/**
 *
 * The reducer is used to simplify all of the possible actions that can be performed on the page.
 *
 * This is being used to help manage our state and to be able to dispatch actions in other components.
 *
 * The reducer should be a pure function with no outside API calls. When the state and action
 * props are the same when called, it should always return the same value.
 */
function queryPageReducer(
  state: QueryPageStates,
  action: QueryPageActions
): QueryPageStates {
  switch (action.type) {
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
     */
    case "PAGINATION_PAGE_CHANGE":
      return {
        ...state,
        loading: true,
        pagination: {
          ...state.pagination,
          offset: state.pagination.limit * action.newPage
        }
      };

    /**
     * When the user changes the react-table page size, it will trigger this event.
     *
     * This method will update the pagination, and since we have a useEffect hook on the pagination
     * this will trigger a new search. This will update the pagination limit.
     */
    case "PAGINATION_SIZE_CHANGE":
      return {
        ...state,
        loading: true,
        pagination: {
          offset: 0,
          limit: action.newSize
        }
      };

    /**
     * When the user changes the react-table page sort, it will trigger this event.
     *
     * This method will cause the useEffect with the search to trigger if the sorting has changed.
     */
    case "SORTING_CHANGE":
      return {
        ...state,
        loading: true,
        sortingRules: action.newSort
      };

    case "SEARCH_FILTER_CHANGE":
      return {
        ...state
      };

    /**
     * User preferences have been reloaded with a new value.
     */
    case "USER_PREFERENCE_CHANGE":
      return {
        ...state,
        userPreferences: action.newUserPreferences
      };

    /**
     * Action is triggered when the saved search dropdown is selected to a new value.
     *
     * The reason this value is stored, is so when the "load"/"delete" button is clicked we know
     * which saved search to perform the action on.
     */
    case "SAVED_SEARCH_CHANGE":
      return {
        ...state,
        selectedSavedSearch: action.newSavedSearch
      };

    /**
     * Using the saved saved search, we can find the saved search in the user preference and load
     * it in.
     */
    case "LOAD_SAVED_SEARCH":
      const loadedOption =
        state.userPreferences?.savedSearches?.[state.indexName]?.[
          state.selectedSavedSearch
        ];
      return !state.selectedSavedSearch ||
        !state.userPreferences ||
        !loadedOption
        ? {
            ...state,
            error: "Could not load the saved search."
          }
        : {
            ...state,
            loading: true,
            searchFilters: loadedOption,
            pagination: {
              ...state.pagination,
              offset: 0
            },
            loadedSavedSearch: state.selectedSavedSearch
          };

    /**
     * Successfully retrieved data from the search results. Loading and errors will be cleared
     * at this point.
     */
    case "SUCCESS_TABLE_DATA":
      return {
        ...state,
        error: undefined,
        loading: false,
        searchResults: action.searchResults,
        totalRecords: action.newTotal
      };

    /**
     * An error has occurred. Display an error message on the page.
     */
    case "ERROR":
      return {
        ...state,
        searchResults: [],
        error: action.errorLabel,
        loading: false
      };

    /**
     * Reset the search filters to a blank state. Errors are also cleared since a new filter is being
     * performed.
     */
    case "RESET":
      return state;

    default:
      throw new Error("Action type not supported: " + action);
  }
}

export interface QueryPageStates {
  /**
   * Index name, the name comes from the props of the QueryPage but we will be treating it like a
   * state to make it easier to pass to children components.
   */
  indexName: string;

  /**
   * Total number of records from the search. This leverages the elastic search count request if
   * needed.
   */
  totalRecords: number;

  /**
   * Current search filters to transform to an elastic search query.
   */
  searchFilters: TransformQueryToDSLParams;

  /**
   * Current sorting rules being applied. This will be passed to elastic search.
   *
   * Please note that multiple rules can be applied at once.
   */
  sortingRules: SortingRule[];

  /**
   * Pagination settings currently being applied. This will be passed to elastic search.
   */
  pagination: LimitOffsetPageSpec;

  /**
   * Search results to be displayed on the page.
   */
  searchResults: any[];

  /**
   * Retrieve the current user preferences. This should only be reloaded if changes were made.
   */
  userPreferences?: UserPreference;

  /**
   * When this state is true, the user preferences will be reloaded.
   */
  reloadUserPreferences: boolean;

  /**
   * Selected saved search for the saved search dropdown.
   */
  selectedSavedSearch: string;

  /**
   * When the user uses the "load" button, the selected saved search is saved here.
   */
  loadedSavedSearch?: string;

  /**
   * Used to display a loading spinner when results are being fetched.
   */
  loading: boolean;

  /**
   * If any error has occurred.
   */
  error: any;
}

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
   */
  bulkEditPath?: (ids: string[]) => {
    pathname: string;
    query: Record<string, string>;
  };

  /** Adds the bulk delete button and the row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;

  reactTableProps?:
    | Partial<TableProps>
    | ((
        responseData: PersistedResource<TData>[] | undefined,
        CheckBoxField: React.ComponentType<CheckBoxFieldProps<TData>>
      ) => Partial<TableProps>);
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
  reactTableProps,
  defaultSort
}: QueryPageProps<TData>) {
  const { formatMessage } = useIntl();
  const { groupNames } = useAccount();

  const initialState: QueryPageStates = {
    indexName,
    totalRecords: 0,
    pagination: {
      limit: DEFAULT_PAGE_SIZE,
      offset: 0
    },
    searchFilters: {
      group: groupNames?.[0] ?? "",
      queryRows: [
        {
          fieldName: ""
        }
      ]
    },
    sortingRules: defaultSort ?? DEFAULT_SORT,
    searchResults: [],
    error: undefined,
    loading: true,
    userPreferences: undefined,
    reloadUserPreferences: true,
    loadedSavedSearch: "default",
    selectedSavedSearch: ""
  };

  const [queryPageState, dispatch] = useReducer(queryPageReducer, initialState);

  const {
    searchResults,
    pagination,
    sortingRules,
    searchFilters,
    loading,
    totalRecords
  } = queryPageState;

  // Row Checkbox Toggle
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // Fetch data if the pagination, sorting or search filters have changed.
  useEffect(() => {
    // Elastic search query with pagination settings.
    const queryDSL = transformQueryToDSL(
      pagination,
      columns,
      sortingRules,
      cloneDeep(searchFilters)
    );

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!queryDSL || !Object.keys(queryDSL).length) return;

    performElasticSearch({ dispatch, indexName, query: queryDSL });
  }, [pagination, searchFilters, sortingRules]);

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "selectedResources",
    defaultAvailableItems: searchResults ?? []
  });

  const computedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(
          searchResults as PersistedResource<TData>[],
          CheckBoxField
        )
      : reactTableProps;

  const resolvedReactTableProps = { sortingRules, ...computedReactTableProps };

  const combinedColumns: TableColumn<TData>[] = [
    ...(showRowCheckboxes
      ? [
          {
            Cell: ({ original: resource }) => (
              <CheckBoxField key={resource.id} resource={resource} />
            ),
            Header: CheckBoxHeader,
            sortable: false,
            width: 200
          }
        ]
      : []),
    ...columns
  ];

  const mappedColumns = combinedColumns.map(column => {
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

  return (
    <DinaForm key={uuidv4()} initialValues={searchFilters} onSubmit={onSubmit}>
      <label
        style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
      >
        <DinaMessage id="search" />
      </label>

      {/* Query Filtering Options */}
      <QueryBuilder
        name="queryRows"
        indexName={indexName}
        onGroupChange={onSubmit}
      />

      <div className="d-flex mb-3">
        <div className="flex-grow-1">
          {/* Saved Searches */}
          <label className="group-field d-flex gap-2 align-items-center mb-2">
            <div className="field-label">
              <strong>Saved Searches</strong>
            </div>
            <div className="flex-grow-1">
              <SavedSearch
                dispatch={dispatch}
                queryPageState={queryPageState}
              />
            </div>
          </label>
        </div>
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
      </div>

      <div
        className="query-table-wrapper"
        role="search"
        aria-label={formatMessage({ id: "queryTable" })}
      >
        <div className="mb-1">
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

            <div className="d-flex gap-3">
              {bulkEditPath && <BulkEditButton bulkEditPath={bulkEditPath} />}
              {bulkDeleteButtonProps && (
                <BulkDeleteButton {...bulkDeleteButtonProps} />
              )}
            </div>
          </div>
        </div>
        <ReactTable
          // Column and data props
          columns={mappedColumns}
          data={searchResults}
          minRows={1}
          // Loading Table props
          loading={loading}
          // Pagination props
          manual={true}
          pageSize={pagination.limit}
          pages={totalRecords ? Math.ceil(totalRecords / pagination.limit) : 0}
          page={pagination.offset / pagination.limit}
          onPageChange={newPage =>
            dispatch({ type: "PAGINATION_PAGE_CHANGE", newPage })
          }
          onPageSizeChange={newSize =>
            dispatch({ type: "PAGINATION_SIZE_CHANGE", newSize })
          }
          pageText={<CommonMessage id="page" />}
          noDataText={<CommonMessage id="noRowsFound" />}
          ofText={<CommonMessage id="of" />}
          rowsText={formatMessage({ id: "rows" })}
          previousText={<CommonMessage id="previous" />}
          nextText={<CommonMessage id="next" />}
          // Sorting props
          onSortedChange={newSort =>
            dispatch({ type: "SORTING_CHANGE", newSort })
          }
          sorted={sortingRules}
          // Table customization props
          {...resolvedReactTableProps}
          className="-striped"
        />
      </div>
    </DinaForm>
  );
}
