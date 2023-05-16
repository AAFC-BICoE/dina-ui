import {
  ColumnDef,
  ExpandedState,
  Row,
  SortingState,
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
import { Pagination } from "./Pagination";
import { DefaultRow, DraggableRow } from "./RowComponents";

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export interface ReactTable8Props<TData> {
  // Columns definations, ref: https://tanstack.com/table/v8/docs/api/core/column
  columns: ColumnDef<TData>[];
  data: TData[];
  // When DnD is enabled, need to call setData() after DnD
  setData?: (data?: TData[]) => void;
  // Enable row drag and drop
  enableDnd?: boolean;
  className?: string;
  // Show pagination on the bottom
  showPagination?: boolean;
  // Show pagination on the top
  showPaginationTop?: boolean;
  pageSizeOptions?: number[];
  defaultSorted?: SortingState;
  defaultExpanded?: ExpandedState;
  // A function to reander the SubComponent in the expended area.
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  // A function that returns true, the the row is extendable
  getRowCanExpand?: (row: Row<TData>) => boolean;
}

export function ReactTable8<TData>({
  data,
  setData,
  columns,
  enableDnd = false,
  className,
  showPagination = false,
  showPaginationTop = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultSorted,
  defaultExpanded,
  renderSubComponent,
  getRowCanExpand
}: ReactTable8Props<TData>) {
  const { formatMessage } = useIntl();
  const [sorting, setSorting] = useState<SortingState>([]);

  function reorderRow(draggedRowIndex: number, targetRowIndex: number) {
    data.splice(targetRowIndex, 0, data.splice(draggedRowIndex, 1)[0] as TData);
    if (!!setData) {
      setData([...data]);
    }
  }

  const table = useReactTable<TData>({
    data,
    columns,
    defaultColumn: { minSize: 0, size: 0 },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand,
    getExpandedRowModel:
      renderSubComponent && getRowCanExpand ? getExpandedRowModel() : undefined,
    getPaginationRowModel:
      showPagination || showPaginationTop ? getPaginationRowModel() : undefined,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getRowId: (row) => ((row as any).id ? (row as any).id : uuidv4()),
    initialState: {
      pagination: { pageSize: pageSizeOptions[0], pageIndex: 0 },
      sorting: defaultSorted,
      expanded: defaultExpanded
    }
  });

  return (
    <div className={`ReactTable8 ${className}`}>
      {showPaginationTop && (
        <Pagination table={table} pageSizeOptions={pageSizeOptions} />
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
                      {...{
                        className: header.column.getCanSort()
                          ? "-cursor-pointer select-none"
                          : "",
                        onClick: header.column.getToggleSortingHandler()
                      }}
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
          {table.getRowModel().rows.length === 0 ? (
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
              <Fragment key={index}>
                {enableDnd ? (
                  <DraggableRow
                    row={row}
                    reorderRow={reorderRow}
                    className={index % 2 === 0 ? "-odd" : "-even"}
                  />
                ) : (
                  <DefaultRow
                    row={row}
                    className={index % 2 === 0 ? "-odd" : "-even"}
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
        <Pagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}
