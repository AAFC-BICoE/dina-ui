import { Row, flexRender } from "@tanstack/react-table";
import { CSSProperties } from "react";
import {
  useDraggable,
  useDroppable,
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";

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
  className,
  style
}: {
  row: Row<TData>;
  reorderRow?: (draggedRowIndex: number, targetRowIndex: number) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const { setNodeRef: setDropRef } = useDroppable({
    id: `droppable-row-${row.id}`,
    data: { rowIndex: row.index }
  });

  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
    transform
  } = useDraggable({
    id: `draggable-row-${row.id}`,
    data: { rowIndex: row.index, row }
  });

  const combinedRef = (el: HTMLTableRowElement | null) => {
    setDropRef(el);
    setDragRef(el);
  };

  return (
    <tr
      className={className}
      ref={combinedRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        ...(transform
          ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
            }
          : {}),
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

export function DraggableTableBody<TData>({
  rows,
  onRowMove,
  renderRow
}: {
  rows: Row<TData>[];
  onRowMove?: (from: number, to: number) => void;
  renderRow: (row: Row<TData>) => React.ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedRowIndex = (active.data.current as any)?.rowIndex;
    const targetRowIndex = (over.data.current as any)?.rowIndex;

    if (draggedRowIndex !== undefined && targetRowIndex !== undefined) {
      onRowMove?.(draggedRowIndex, targetRowIndex);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {rows.map((row) => renderRow(row))}
    </DndContext>
  );
}
