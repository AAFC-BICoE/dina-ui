import { FormikContextType } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { toPairs, uniqBy } from "lodash";
import { useEffect, useState } from "react";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { useIntl } from "react-intl";
import ReactTable, { SortingRule, TableProps } from "react-table";
import { useRecoilState } from "recoil";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton,
  CheckBoxFieldProps,
  CommonMessage,
  FieldHeader,
  FormikButton,
  LoadingSpinner,
  useGroupedCheckBoxes
} from "..";
import { MultiSortTooltip } from "./MultiSortTooltip";
import {
  searchResultsState,
  totalRecordsState,
  paginationState,
  sortingRulesState,
  loadingState
} from "./recoil_state";
import { TableColumn } from "./types";

export interface QueryResultTableProps<TData extends KitsuResource> {
  /**
   * Columns to render on the table. This will also be used to map the data to a specific column.
   */
  columns: TableColumn<TData>[];

  /**
   * When enabled, the user will see the results table with a selection table.
   *
   * QueryBuilder and Saved Searches will appear as normal.
   *
   * Bulk editing mode is disabled in this mode.
   */
  selectionMode: boolean;

  /**
   * If selection mode is enabled, this must be set.
   *
   * Outside of the QueryPage, a react state must be setup to hold the resources that have been
   * selected.
   *
   * These are the currently selected resources which will be displayed on the right table of the
   * selection mode QueryPage.
   */
  selectedResources?: TData[];

  /**
   * If selection mode is enabled, this must be set.
   *
   * This will be used to set selection mode resources using the ">>" or "<<" options.
   */
  setSelectedResources?: React.Dispatch<React.SetStateAction<TData[]>>;

  /**
   * By default, the QueryPage will try sorting using `createdOn` attribute. You can override this
   * setting by providing your own default sort.
   */
  defaultSort?: SortingRule[];

  /**
   * Event prop triggered when the user changes the sort settings.
   *
   * @param SortingRule[] rules for sorting. Contains the id (column name) and
   *        sorting order.
   */
  onSortedChange?: (newSort: SortingRule[]) => void;

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
}

export function QueryResultTable<TData extends KitsuResource>({
  columns,
  selectionMode,
  selectedResources,
  setSelectedResources,
  defaultSort,
  onSortedChange,
  bulkEditPath,
  singleEditPath,
  bulkDeleteButtonProps,
  reactTableProps
}: QueryResultTableProps<TData>) {
  const { formatMessage } = useIntl();

  // Row Checkbox Toggle
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  const [searchResults] = useRecoilState(searchResultsState);
  const [totalRecords] = useRecoilState(totalRecordsState);
  const [pagination, setPagination] = useRecoilState(paginationState);
  const [sortingRules, setSortingRules] = useRecoilState(sortingRulesState);
  const [loading, setLoading] = useRecoilState(loadingState);

  // If a default sort is provided then we can use that instead.
  useEffect(() => {
    if (defaultSort) {
      setSortingRules(defaultSort);
    }
  }, []);

  useEffect(() => {
    setAvailableResources(searchResults);
  }, [searchResults]);

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

    // setSelectedResources(selectedResourcesAppended);
    // setRemovableItems(selectedResourcesAppended);

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

  return (
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
            // TbodyComponent={
            //   error
            //     ? () => (
            //         <div
            //           className="alert alert-danger"
            //           style={{
            //             whiteSpace: "pre-line"
            //           }}
            //         >
            //           <p>
            //             {error.errors?.map((e) => e.detail).join("\n") ??
            //               String(error)}
            //           </p>
            //           <button
            //             type="button"
            //             className="btn btn-primary"
            //             onClick={() => {
            //               const newSort = defaultSort ?? DEFAULT_SORT;
            //               setError(undefined);
            //               onSortChange(newSort);
            //             }}
            //           >
            //             <CommonMessage id="resetSort" />
            //           </button>
            //         </div>
            //       )
            //     : resolvedReactTableProps?.TbodyComponent ?? DefaultTBody
            // }
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
  );
}
