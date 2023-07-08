import {
  ColumnDef,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import classnames from "classnames";
import { Fragment, useState } from "react";

import { useIntl } from "react-intl";
import { v4 as uuidv4 } from "uuid";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { Pagination } from "./Pagination";
import { DefaultRow, DraggableRow } from "./RowComponents";
import { boolean } from "mathjs";

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export interface ReactTable8Props<TData> {
  // Columns definations, ref: https://tanstack.com/table/v8/docs/api/core/column
  columns: ColumnDef<TData>[];
  data: TData[];
  // When DnD is enabled, need to call setData() after DnD
  setData?: (data?: TData[]) => void;
  // Enable row drag and drop
  enableDnd?: boolean;
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  manualSorting?: boolean;
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
  defaultSorted?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  defaultExpanded?: ExpandedState;
  // A function to reander the SubComponent in the expended area.
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  // A function that returns true, the the row is extendable
  getRowCanExpand?: (row: Row<TData>) => boolean;
  // A function is called when expanded state changes.
  onExpandedChange?: OnChangeFn<ExpandedState>;
  // Styling to be applied to each row of the React Table
  rowStyling?: (row?: Row<TData>) => any;
  loading?: boolean;
  columnVisibility?: VisibilityState;
  highlightRow?: boolean;
  TbodyComponent?: React.ElementType;
}

export function ReactTable8<TData>({
  data,
  setData,
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
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultSorted,
  onSortingChange,
  manualSorting = false,
  defaultExpanded,
  renderSubComponent,
  getRowCanExpand,
  onExpandedChange,
  rowStyling,
  loading = false,
  columnVisibility,
  highlightRow = true,
  TbodyComponent
}: ReactTable8Props<TData>) {
  const { formatMessage } = useIntl();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page ?? 0,
    pageSize: initPageSize ?? pageSizeOptions[0]
  });

  function reorderRow(draggedRowIndex: number, targetRowIndex: number) {
    data.splice(targetRowIndex, 0, data.splice(draggedRowIndex, 1)[0] as TData);
    if (!!setData) {
      setData([...data]);
    }
  }

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

  function onExpandedChangeInternal(updator) {
    const newState = updator(table.getState().expanded);
    onExpandedChange?.(newState);
  }

  const tableStateOption = manualPagination
    ? {
        state: {
          pagination: { pageIndex, pageSize },
          sorting,
          columnVisibility
        }
      }
    : { state: { sorting, columnVisibility } };

  const getExpandedRowModelOption =
    renderSubComponent && getRowCanExpand
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

  const tableOption = {
    data,
    columns,
    defaultColumn: { minSize: 0, size: 0 },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand,

    getRowId: (row) => ((row as any).id ? (row as any).id : uuidv4()),
    initialState: {
      expanded: defaultExpanded,
      sorting: defaultSorted
    },
    enableSorting,
    enableMultiSort,
    manualPagination,
    manualSorting,
    onExpandedChange: onExpandedChangeInternal,
    ...getExpandedRowModelOption,
    ...tableStateOption,
    ...onPaginationChangeOption,
    ...onSortingChangeOption
  };

  const table = useReactTable<TData>(tableOption);

  return (
    <div
      className={classnames(
        "ReactTable8",
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
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className={classnames(
                    header.column.getCanSort() && "-cursor-pointer",
                    header.column.getIsSorted() === "asc" && "-sort-asc",
                    header.column.getIsSorted() === "desc" && "-sort-desc"
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
                </th>
              ))}
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
                    reorderRow={reorderRow}
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
                      {renderSubComponent?.({ row })}
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
  );
}
