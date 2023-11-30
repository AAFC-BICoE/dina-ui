import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  PaginationState,
  Row,
  SortingState,
  Table,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import classnames from "classnames";
import { Fragment, useState, useEffect } from "react";

import { useIntl } from "react-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { FilterInput } from "./FilterInput";
import { Pagination } from "./Pagination";
import { DefaultRow, DraggableRow } from "./RowComponents";
import { Checkbox } from "../column-selector/GroupedCheckboxWithLabel";
import {
  ColumnSelector,
  ColumnSelectorMenu
} from "../column-selector/ColumnSelector";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { string } from "yup";

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export interface ReactTableProps<TData> {
  // Columns definations, ref: https://tanstack.com/table/v8/docs/api/core/column
  columns: ColumnDef<TData>[];
  data: TData[];
  onDataChanged?: (newData: TData[]) => void;
  enableEditing?: boolean;
  // When DnD is enabled, need to call onRowMove() after DnD
  onRowMove?: (from: number, to: number) => void;
  // Enable row drag and drop
  enableDnd?: boolean;
  // Sorting
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  manualSorting?: boolean;
  defaultSorted?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  // Filtering
  enableFilters?: boolean;
  manualFiltering?: boolean;
  onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void;
  defaultColumnFilters?: ColumnFiltersState;
  // Class name of this component.
  className?: string;
  // handle pagination manually
  manualPagination?: boolean;
  pageSize?: number;
  pageCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Show pagination on the bottom
  showPagination?: boolean;
  // Show pagination on the top
  showPaginationTop?: boolean;
  pageSizeOptions?: number[];
  defaultExpanded?: ExpandedState;
  // A function to render the SubComponent in the expanded area.
  renderSubComponent?: (props: {
    row: Row<TData>;
    index?: number;
  }) => React.ReactElement;
  // A function that returns true, the the row is expandable
  getRowCanExpand?: (row: Row<TData>) => boolean;
  // Styling to be applied to each row of the React Table
  rowStyling?: (row?: Row<TData>) => any;
  loading?: boolean;
  columnVisibility?: VisibilityState;
  highlightRow?: boolean;
  TbodyComponent?: React.ElementType;

  // Hides the table rendering. Useful for accessing table states but don't want to render table
  hideTable?: boolean;

  // Pass the Column Selector to parent caller
  setColumnSelector?: React.Dispatch<React.SetStateAction<JSX.Element>>;

  // Pass the Column Selector Menu to parent caller
  setColumnSelectorCustomMenu?: React.Dispatch<
    React.SetStateAction<JSX.Element>
  >;

  // uniqueName used for local storage
  uniqueName?: string;
}

export function ReactTable<TData>({
  data,
  onRowMove,
  columns,
  enableDnd = false,
  enableSorting = true,
  enableMultiSort = false,
  className,
  showPagination = false,
  showPaginationTop = false,
  manualPagination = false,
  pageSize: initPageSize,
  pageCount,
  page,
  onPageChange,
  onPageSizeChange,
  onDataChanged,
  enableEditing,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultSorted,
  onSortingChange,
  manualSorting = false,
  defaultExpanded,
  renderSubComponent,
  getRowCanExpand,
  rowStyling,
  loading = false,
  columnVisibility: columnVisibilityExternal,
  highlightRow = true,
  TbodyComponent,
  enableFilters = false,
  manualFiltering = false,
  onColumnFiltersChange,
  defaultColumnFilters = [],
  hideTable = false,
  setColumnSelector,
  setColumnSelectorCustomMenu,
  uniqueName
}: ReactTableProps<TData>) {
  const { formatMessage } = useIntl();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(defaultColumnFilters);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page ?? 0,
    pageSize: initPageSize ?? pageSizeOptions[0]
  });

  function onPaginationChangeInternal(updater) {
    const { pageIndex: oldPageIndex, pageSize: oldPageSize } =
      table.getState().pagination;
    const newState = updater(table.getState().pagination);
    if (oldPageSize !== newState.pageSize) {
      onPageSizeChange?.(newState.pageSize);
    } else if (oldPageIndex !== newState.pageIndex) {
      onPageChange?.(newState.pageIndex);
    }
    setPagination(newState);
  }

  function onSortingChangeInternal(updator) {
    const newState = updator(table.getState().sorting);
    onSortingChange?.(newState);
    setSorting(newState);
  }

  function onColumnFiltersChangeInternal(updator) {
    const newState = updator(table.getState().columnFilters);
    onColumnFiltersChange?.(newState);
    setColumnFilters(newState);
  }

  const paginationStateOption = manualPagination
    ? {
        pagination: { pageIndex, pageSize }
      }
    : {};

  const getExpandedRowModelOption =
    !!renderSubComponent && !!getRowCanExpand
      ? { getExpandedRowModel: getExpandedRowModel() }
      : {};

  const onPaginationChangeOption = manualPagination
    ? {
        onPaginationChange: onPaginationChangeInternal,
        pageCount
      }
    : {
        getPaginationRowModel: getPaginationRowModel()
      };

  const onSortingChangeOption = manualSorting
    ? { onSortingChange: onSortingChangeInternal }
    : { onSortingChange: setSorting };

  const onColumnFilterChangeOption = manualFiltering
    ? { onColumnFiltersChange: onColumnFiltersChangeInternal }
    : { onColumnFiltersChange: setColumnFilters };
  const [columnVisibility, setColumnVisibility] = useState(
    columnVisibilityExternal
  );

  const tableOption = {
    data,
    columns,
    defaultColumn: { minSize: 0, size: 0 },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowCanExpand,
    initialState: {
      expanded: defaultExpanded,
      sorting: defaultSorted
    },
    enableSorting,
    enableMultiSort,
    manualPagination,
    manualSorting,
    ...getExpandedRowModelOption,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      ...paginationStateOption
    },
    enableFilters,
    manualFiltering,
    onColumnVisibilityChange: setColumnVisibility,
    ...onPaginationChangeOption,
    ...onSortingChangeOption,
    ...onColumnFilterChangeOption,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        if (enableEditing) {
          onDataChanged?.(
            data.map((row, index) => {
              if (index === rowIndex) {
                return {
                  ...data[rowIndex]!,
                  [columnId]: value
                };
              }
              return row;
            })
          );
        }
      }
    }
  };

  const table = useReactTable<TData>(tableOption);

  useEffect(() => {
    if (setColumnSelector) {
      const columnSelector = (
        <ColumnSelector
          uniqueName={uniqueName}
          reactTable={table}
          hideExportButton={true}
        />
      );
      setColumnSelector?.(columnSelector);
    }
    if (setColumnSelectorCustomMenu) {
      const columnSelector = (
        <ColumnSelector
          uniqueName={uniqueName}
          reactTable={table}
          hideExportButton={true}
          menuOnly={true}
        />
      );
      setColumnSelectorCustomMenu(columnSelector);
    }
  }, [
    ...table.getAllLeafColumns().map((column) => column.getIsVisible()),
    table.getAllLeafColumns().length
  ]);

  return !hideTable ? (
    <div
      className={classnames(
        "ReactTable",
        className,
        highlightRow && !TbodyComponent ? "-highlight" : ""
      )}
    >
      {showPaginationTop && (
        <div className="pagination-top">
          <Pagination table={table} pageSizeOptions={pageSizeOptions} />
        </div>
      )}
      <table className="w-100">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const defaultSortRule = defaultSorted?.find(
                  (sortRule) => sortRule.id === header.id
                );

                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={classnames(
                      header.column.getCanSort() && "-cursor-pointer",
                      header.column.getIsSorted() === "asc" && "-sort-asc",
                      header.column.getIsSorted() === "desc" && "-sort-desc",
                      defaultSortRule?.desc === false && "-sort-asc",
                      defaultSortRule?.desc === true && "-sort-desc"
                    )}
                    style={{
                      width:
                        header.column.columnDef.size === 0
                          ? "auto"
                          : header.column.columnDef.size
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "-cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                    {header.column.getCanFilter() ? (
                      <div>
                        <FilterInput column={header.column} />
                      </div>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="text-center"
              >
                <LoadingSpinner loading={true} />
              </td>
            </tr>
          ) : !!TbodyComponent ? (
            <tr>
              <td colSpan={table.getAllColumns().length}>
                <TbodyComponent />
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="text-center"
              >
                {formatMessage({ id: "noRowsFound" })}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, index) => (
              <Fragment key={row.id ?? index}>
                {enableDnd ? (
                  <DraggableRow
                    row={row}
                    reorderRow={onRowMove}
                    className={classnames(
                      `index-${index}`,
                      index % 2 === 0 ? "-odd" : "-even"
                    )}
                    style={rowStyling ? rowStyling(row) : undefined}
                  />
                ) : (
                  <DefaultRow
                    row={row}
                    className={classnames(
                      `index-${index}`,
                      index % 2 === 0 ? "-odd" : "-even"
                    )}
                    style={rowStyling ? rowStyling(row) : undefined}
                  />
                )}
                {row.getIsExpanded() && (
                  <tr>
                    {/* 2nd row is a custom 1 cell row that contains the extended area */}
                    <td colSpan={row.getVisibleCells().length}>
                      {renderSubComponent?.({ row, index })}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
      {showPagination && (
        <div className="pagination-bottom">
          <Pagination table={table} pageSizeOptions={pageSizeOptions} />
        </div>
      )}
    </div>
  ) : null;
}
