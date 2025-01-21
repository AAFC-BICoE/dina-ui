import { Row, flexRender } from "@tanstack/react-table";
import { CSSProperties } from "react";
import { useDrag, useDrop } from "react-dnd";

const ITEM_DRAG_KEY = "ReactTableRowDndKey";

export function DefaultRow<TData>({
  row,
  className,
  style
}: {
  row: Row<TData>;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <tr key={row.id} className={className} style={style}>
      {row.getVisibleCells().map((cell) => {
        const cellClassNames: string =
          (cell.column.columnDef.meta as any)?.className ?? "";
        const cellStyle: CSSProperties | undefined = (
          cell.column.columnDef.meta as any
        )?.style;
        return (
          <td key={cell.id} className={cellClassNames} style={cellStyle}>
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
  className,
  style
}: {
  row: Row<TData>;
  reorderRow?: (draggedRowIndex: number, targetRowIndex: number) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const [, dropRef] = useDrop({
    accept: ITEM_DRAG_KEY,
    drop: (draggedRow) =>
      reorderRow?.((draggedRow as any).row.index, row.index),
    canDrop: () => true
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    type: ITEM_DRAG_KEY,
    collect: (monitor) => {
      if (monitor.isDragging() && row.getIsExpanded()) {
        row.toggleExpanded(false);
      }
      return {
        isDragging: monitor.isDragging()
      };
    },
    item: { row, type: ITEM_DRAG_KEY },
    canDrag: () => true
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
        ...{
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? "grabbing" : "grab"
        },
        ...style
      }}
    >
      {row.getVisibleCells().map((cell) => {
        const cellClassNames: string =
          (cell.column.columnDef.meta as any)?.className ?? "";
        const cellStyle: CSSProperties | undefined = (
          cell.column.columnDef.meta as any
        )?.style;
        return (
          <td key={cell.id} className={cellClassNames} style={cellStyle}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}
