import { KitsuResource, PersistedResource } from "kitsu";
import { TableProps, SortingRule } from "react-table";
import { DinaForm } from "../formik-connected/DinaForm";
import { BulkDeleteButtonProps } from "../list-page-layout/bulk-buttons";
import { CheckBoxFieldProps } from "../formik-connected/GroupedCheckBoxFields";
import { v4 as uuidv4 } from "uuid";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { TableColumn } from "./types";
import { ImmutableTree } from "react-awesome-query-builder";
import { useElasticSearchRequest } from "./useElasticSearchRequest";
import { QueryResultTable } from "./QueryResultTable";
import { useSavedSearch } from "./useSavedSearch";
import { QueryBuilder } from "..";

export const DEFAULT_PAGE_SIZE: number = 25;
export const DEFAULT_SORT: SortingRule[] = [
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
  viewMode: boolean;

  /**
   * Custom elastic search query given by calling component
   */
  customViewQuery?: ImmutableTree;
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
  viewMode = false
}: QueryPageProps<TData>) {
  // Everything required to perform the elastic search result.
  const { performElasticSearchRequest } = useElasticSearchRequest<TData>({
    indexName,
    columns
  });

  // Everything required for the saved search.
  const { SavedSearchSection } = useSavedSearch({ indexName });

  return (
    <DinaForm key={uuidv4()} initialValues={{}}>
      {!viewMode && (
        <label
          style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
        >
          <DinaMessage id="search" />
        </label>
      )}

      {/* Query Filtering Options */}
      {!viewMode && <QueryBuilder />}

      {/* Saved Searches Section  */}
      <div className="d-flex mb-3">{!viewMode && SavedSearchSection}</div>

      {/* Display Results */}
      <QueryResultTable
        columns={columns}
        bulkDeleteButtonProps={bulkDeleteButtonProps}
        bulkEditPath={bulkEditPath}
        reactTableProps={reactTableProps as any}
        selectedResources={selectedResources}
        setSelectedResources={setSelectedResources}
        singleEditPath={singleEditPath}
        selectionMode={selectionMode}
        defaultSort={defaultSort}
        onSortedChange={onSortedChange}
      />
    </DinaForm>
  );
}
