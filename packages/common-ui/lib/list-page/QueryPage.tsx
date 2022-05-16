import { KitsuResource, PersistedResource } from "kitsu";
import { useReducer } from "react";
import { useIntl } from "react-intl";
import ReactTable, { TableProps, SortingRule } from "react-table";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "./QueryBuilder";
import { transformQueryToDSL } from "../util/transformToDSL";
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
import { FormikButton, useAccount, useApiClient } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { useEffect } from "react";
import { TableColumn } from "./types";
import { performElasticSearch } from "./performElasticSearch";
import { queryPageReducer, QueryPageStates } from "./queryPageReducer";

const DEFAULT_PAGE_SIZE: number = 25;
const DEFAULT_SORT: SortingRule[] = [
  {
    id: "createdOn",
    desc: true
  }
];

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
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();
  const { groupNames } = useAccount();

  const initialState: QueryPageStates = {
    indexName,
    elasticSearchIndex: [],
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
    elasticSearchLoading: true,
    userPreferences: undefined,
    reloadUserPreferences: true,
    loadedSavedSearch: "default",
    selectedSavedSearch: "",
    performElasticSearchRequest: true,
    performIndexRequest: true,
    indexLoading: true
  };

  // Reducer to handle all user actions, checkout the queryPageReducer.tsx file.
  const [queryPageState, dispatch] = useReducer(queryPageReducer, initialState);

  // Deconstructed values from the query page reducer state.
  const {
    searchResults,
    pagination,
    sortingRules,
    searchFilters,
    elasticSearchLoading,
    totalRecords,
    performElasticSearchRequest
  } = queryPageState;

  // Row Checkbox Toggle
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // Fetch data if the pagination, sorting or search filters have changed.
  useEffect(() => {
    if (!performElasticSearchRequest) return;

    // Elastic search query with pagination settings.
    const queryDSL = transformQueryToDSL(
      pagination,
      columns,
      sortingRules,
      cloneDeep(searchFilters)
    );

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!queryDSL || !Object.keys(queryDSL).length) return;

    performElasticSearch({ dispatch, indexName, query: queryDSL, apiClient });
  }, [performElasticSearchRequest]);

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
    dispatch({ type: "SEARCH_FILTER_CHANGE", newFilter: resetToVal as any });
  }

  return (
    <DinaForm
      key={uuidv4()}
      initialValues={searchFilters}
      onSubmit={({ submittedValues }) =>
        dispatch({ type: "SEARCH_FILTER_CHANGE", newFilter: submittedValues })
      }
    >
      <label
        style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
      >
        <DinaMessage id="search" />
      </label>

      {/* Query Filtering Options */}
      <QueryBuilder
        name="queryRows"
        dispatch={dispatch}
        states={queryPageState}
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
              {elasticSearchLoading ? (
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
          loading={elasticSearchLoading}
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
