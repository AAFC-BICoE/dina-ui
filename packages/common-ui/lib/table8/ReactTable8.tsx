import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import classnames from "classnames";
import { useState } from "react";

import { useIntl } from "react-intl";
import { v4 as uuidv4 } from "uuid";
import { DefaultRow, DraggableRow } from "./RowComponents";

export function ReactTable8<TData>({
  data,
  setData,
  columns,
  enableDnd = false,
  className
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  setData?: (data?: TData[]) => void;
  enableDnd?: boolean;
  className?: string;
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
    getRowId: (row) => ((row as any).id ? (row as any).id : uuidv4())
  });

  return (
    <table className={`ReactTable8 w-100 ${className}`}>
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
            <td colSpan={table.getAllColumns().length} className="text-center">
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
  );
}
