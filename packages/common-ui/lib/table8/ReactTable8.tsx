import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import classnames from "classnames";
import { useState } from "react";

import { useIntl } from "react-intl";
import { v4 as uuidv4 } from "uuid";
import { Pagination } from "./Pagination";
import { DefaultRow, DraggableRow } from "./RowComponents";

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export function ReactTable8<TData>({
  data,
  setData,
  columns,
  enableDnd = false,
  className,
  showPagination = false,
  showPaginationTop = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultSorting
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  setData?: (data?: TData[]) => void;
  enableDnd?: boolean;
  className?: string;
  showPagination?: boolean;
  showPaginationTop?: boolean;
  pageSizeOptions?: number[];
  defaultSorting?: SortingState;
}) {
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getRowId: (row) => ((row as any).id ? (row as any).id : uuidv4()),
    getPaginationRowModel:
      showPagination || showPaginationTop ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: { pageSize: pageSizeOptions[0], pageIndex: 0 },
      sorting: defaultSorting
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
            table
              .getRowModel()
              .rows.map((row, index) =>
                enableDnd ? (
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
                )
              )
          )}
        </tbody>
      </table>
      {showPagination && (
        <Pagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}
