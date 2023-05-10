import { Row, flexRender } from "@tanstack/react-table";
import { useDrag, useDrop } from "react-dnd-cjs";

const ITEM_DRAG_KEY = "ReactTable8RowDndKey";

export function DefaultRow<TData>({
  row,
  className
}: {
  row: Row<TData>;
  className?: string;
}) {
  return (
    <tr key={row.id} className={className}>
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

export function DraggableRow<TData>({
  row,
  reorderRow,
  className
}: {
  row: Row<TData>;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
  className?: string;
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
      className={className}
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
