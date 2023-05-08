import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { KitsuResource } from "kitsu";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useDrag, useDrop } from "react-dnd-cjs";

export function ReactTable8<TData extends KitsuResource>({
  data,
  setData,
  columns,
  enableDnd = false
}: {
  data: TData[];
  setData: (data: TData[]) => void;
  columns: ColumnDef<TData>[];
  enableDnd?: boolean;
}) {
  function reorderRow(draggedRowIndex: number, targetRowIndex: number) {
    data.splice(targetRowIndex, 0, data.splice(draggedRowIndex, 1)[0] as TData);
    setData([...data]);
  }

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id ?? ""
  });

  return (
    <table className="ReactTable8 w-100">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ? null : (
                  <div
                    {...{
                      className: header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : "",
                      onClick: header.column.getToggleSortingHandler()
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽"
                    }[header.column.getIsSorted() as string] ?? null}
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
              <DinaMessage id="noRowsFound" />
            </td>
          </tr>
        ) : (
          table
            .getRowModel()
            .rows.map((row) =>
              enableDnd ? (
                <DraggableRow row={row} reorderRow={reorderRow} />
              ) : (
                <DefaultRow row={row} />
              )
            )
        )}
      </tbody>
    </table>
  );
}

function DefaultRow<TData extends KitsuResource>({ row }: { row: Row<TData> }) {
  return (
    <tr key={row.id}>
      {row.getVisibleCells().map((cell) => {
        return (
          <td key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}

const ITEM_DRAG_KEY = "ReactTable8RowDndKey";

function DraggableRow<TData extends KitsuResource>({
  row,
  reorderRow
}: {
  row: Row<TData>;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
}) {
  const [, dropRef] = useDrop({
    accept: ITEM_DRAG_KEY,
    drop: (draggedRow) => reorderRow((draggedRow as any).row.index, row.index),
    canDrop: () => true
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    item: { row, type: ITEM_DRAG_KEY },
    canDrag: true
  });

  return (
    <tr
      ref={(el) => {
        dropRef(el);
        dragRef(el);
        previewRef(el);
      }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab"
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}
