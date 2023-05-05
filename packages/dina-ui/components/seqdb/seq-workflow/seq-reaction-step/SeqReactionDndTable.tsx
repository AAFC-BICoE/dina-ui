import {
  ColumnDef,
  ColumnDefBase,
  Row,
  RowData,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { FieldHeader, useGroupedCheckBoxes } from "packages/common-ui/lib";
import {
  SeqReaction,
  pcrBatchItemResultColor
} from "packages/dina-ui/types/seqdb-api";
import { FC, useRef, useEffect, HTMLProps } from "react";
import { useDrag, useDrop } from "react-dnd-cjs";

const ITEM_DRAG_KEY = "DND_SEQ_REACTION";

export interface SeqReactionDnDTableProps {
  selectedSeqReactions: SeqReaction[];
  setSelectedSeqReactions: (seqReactions: SeqReaction[]) => void;
  editMode: boolean;
}

export interface DndColumnDef<TData extends RowData, TValue = unknown>
  extends ColumnDefBase<TData, TValue> {
  enableDnd: boolean;
}

export function SeqReactionDndTable({
  selectedSeqReactions,
  setSelectedSeqReactions,
  editMode
}: SeqReactionDnDTableProps) {
  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    selectedSeqReactions.splice(
      targetRowIndex,
      0,
      selectedSeqReactions.splice(draggedRowIndex, 1)[0] as SeqReaction
    );
    setSelectedSeqReactions([...selectedSeqReactions]);
  };

  // Checkbox for second table where selected/to be deleted items are displayed
  const {
    CheckBoxField: DeselectCheckBox,
    CheckBoxHeader: DeselectCheckBoxHeader,
    setAvailableItems: setRemovableItems
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToDelete"
  });

  const SELECTED_RESOURCE_SELECT_ALL_HEADER: ColumnDef<SeqReaction>[] = editMode
    ? [
        {
          id: "selectColumn",
          cell: ({ row }) => (
            <DeselectCheckBox
              key={`${row.original?.pcrBatchItem?.id}_${row.original?.seqPrimer?.id}`}
              resource={row.original}
            />
          ),
          header: () => <DeselectCheckBoxHeader />,
          enableSorting: false
        }
      ]
    : [];

  const seqReactionColumns: ColumnDef<SeqReaction>[] = [
    ...SELECTED_RESOURCE_SELECT_ALL_HEADER,
    {
      id: "materialSampleName",
      accessorFn: (row) =>
        row.pcrBatchItem?.materialSample?.materialSampleName ?? "",
      header: () => <FieldHeader name={"sampleName"} />,
      enableSorting: true
    },
    {
      id: "result",
      cell: ({ row }) => (
        <div
          style={{
            backgroundColor:
              "#" + pcrBatchItemResultColor(row.original?.pcrBatchItem?.result),
            borderRadius: "5px",
            paddingLeft: "5px"
          }}
        >
          {row.original?.pcrBatchItem?.result ?? ""}
        </div>
      ),
      header: () => <FieldHeader name={"result"} />,
      enableSorting: false
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) =>
        row.original?.pcrBatchItem?.wellRow === null ||
        row.original?.pcrBatchItem?.wellColumn === null
          ? ""
          : row.original.pcrBatchItem?.wellRow +
            "" +
            row.original.pcrBatchItem?.wellColumn,
      header: () => <FieldHeader name={"wellCoordinates"} />,
      enableSorting: false
    },
    {
      id: "tubeNumber",
      cell: ({ row }) => row.original?.pcrBatchItem?.cellNumber || "",
      header: () => <FieldHeader name={"tubeNumber"} />,
      enableSorting: false
    },
    {
      id: "primer",
      cell: ({ row }) => row.original?.seqPrimer?.name || "",
      header: () => <FieldHeader name={"primer"} />,
      enableSorting: false
    },
    {
      id: "direction",
      cell: ({ row }) => row.original?.seqPrimer?.direction || "",
      header: () => <FieldHeader name={"direction"} />,
      enableSorting: false
    }
  ];

  const table = useReactTable<SeqReaction>({
    data: selectedSeqReactions,
    columns: seqReactionColumns,
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
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <DraggableRow
            key={row.id}
            row={row}
            reorderRow={reorderRow}
            editMode={editMode}
          />
        ))}
      </tbody>
    </table>
  );
}

const DraggableRow: FC<{
  editMode: boolean;
  row: Row<SeqReaction>;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
}> = ({ row, reorderRow, editMode }) => {
  const [, dropRef] = useDrop({
    accept: ITEM_DRAG_KEY,
    drop: (draggedRow) => reorderRow((draggedRow as any).index, row.index),
    canDrop: () => editMode
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    item: { row, type: ITEM_DRAG_KEY },
    canDrag: editMode
  });

  return (
    <tr
      // ref={previewRef} //previewRef could go here
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
};

function IndeterminateCheckbox({
  indeterminate,
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return <input type="checkbox" ref={ref} {...rest} />;
}
