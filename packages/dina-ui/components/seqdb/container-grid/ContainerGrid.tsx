import { ColumnDef } from "@tanstack/react-table";
import RcTooltip from "rc-tooltip";
import { useEffect, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ReactTable } from "../../../../common-ui/lib";
import { DraggableItemBox } from "./DraggableItemBox";

interface ContainerGridProps<BatchType, ItemType> {
  batch: BatchType;
  cellGrid: CellGrid<ItemType>;
  movedItems: ItemType[];
  onDrop: (item: ItemType, coords: string) => void;
  editMode: boolean;
  className?: string;
}

interface GridCellProps<ItemType> {
  onDrop: (item: { batchItemSample: ItemType }) => void;
  movedItems: ItemType[];
  batchItemSample: ItemType;
  coordinates: string;
  editMode: boolean;
}

/**
 * key: `${resource.wellRow}_${resource.wellColumn}`
 *
 * value: {sampleName, ...resource}
 */
export interface CellGrid<ItemType> {
  [key: string]: ItemType;
}

export function ContainerGrid<
  BatchType extends { gridLayoutDefinition?: any },
  ItemType extends { sampleId?: string; sampleName?: string }
>({
  batch,
  cellGrid,
  movedItems,
  onDrop,
  editMode,
  className
}: ContainerGridProps<BatchType, ItemType>) {
  const [numberOfRows, setNumberOfRows] = useState<number>(0);
  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  useEffect(() => {
    if (!batch) return;
    if (batch?.gridLayoutDefinition) {
      setNumberOfRows(batch.gridLayoutDefinition.numberOfRows);
      setNumberOfColumns(batch.gridLayoutDefinition.numberOfColumns);
    }
  }, [batch]);

  // Generate table columns, only when the row/column number changes.
  const tableColumns: ColumnDef<any>[] = useMemo(() => {
    const columns: ColumnDef<any>[] = [];

    // Add the letter column.
    columns.push({
      id: "col-index",
      cell: ({ row: { index } }) => (
        <div style={{ padding: "7px 5px", textAlign: "center" }}>
          {String.fromCharCode(index + 65)}
        </div>
      ),
      enableSorting: false,
      size: 40,
      meta: {
        style: {
          position: "sticky",
          left: 0,
          background: "white",
          boxShadow: "7px 0px 9px 0px rgba(0,0,0,0.1)",
          zIndex: 500
        }
      }
    });

    for (let col = 0; col < numberOfColumns; col++) {
      const column = String(col + 1);
      const columnLabel = <div style={{ textAlign: "center" }}>{column}</div>;

      columns.push({
        id: `col-${column}`,
        cell: ({ row: { index } }) => {
          const rowLabel = String.fromCharCode(index + 65);
          const coords = `${rowLabel}_${column}`;

          return (
            <div className={`well-${coords}`} style={{ minHeight: "40px" }}>
              <GridCell<ItemType>
                movedItems={movedItems}
                onDrop={({ batchItemSample: newItem }) =>
                  onDrop(newItem, coords)
                }
                batchItemSample={cellGrid[coords]}
                editMode={editMode}
                coordinates={coords.replace("_", "")}
                coordinatesKey={coords}
              />
            </div>
          );
        },
        header: () => columnLabel,
        enableSorting: false,
        size: 150
      });
    }

    return columns;
  }, [numberOfRows, numberOfColumns, movedItems, editMode]);

  // ReactTable needs a data object in every row.
  const tableData = new Array(numberOfRows).fill({});

  return (
    <div>
      <style>{`
        .rt-td {
          padding: 0 !important;
        }

        .ReactTable {
          overflow-x: auto;
        }
      `}</style>
      <ReactTable<any>
        className={className}
        columns={tableColumns}
        data={tableData}
        showPagination={false}
        enableSorting={false}
      />
    </div>
  );
}

interface GridCellPropsInternal<ItemType> extends GridCellProps<ItemType> {
  coordinatesKey: string;
}

function GridCell<ItemType extends { sampleName?: string }>({
  batchItemSample: batchItemSample,
  coordinates,
  coordinatesKey,
  movedItems,
  editMode
}: GridCellPropsInternal<ItemType>) {
  const [hover, setHover] = useState<boolean>(false);

  const { setNodeRef: drop, isOver: dragHover } = useDroppable({
    id: `droppable-cell-${coordinatesKey}`,
    data: { coords: coordinatesKey }
  });

  return (
    <RcTooltip
      placement="top"
      trigger={"hover"}
      visible={(dragHover || hover) && batchItemSample === undefined}
      overlay={<div style={{ maxWidth: "15rem" }}>{coordinates}</div>}
    >
      <div
        ref={drop}
        style={{
          border: dragHover ? "3px dashed #1C6EA4" : undefined,
          background: dragHover ? "#f7fbff" : undefined,
          minHeight: "40px"
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {batchItemSample && (
          <DraggableItemBox<ItemType>
            batchItemSample={batchItemSample}
            selected={false}
            wasMoved={movedItems.includes(batchItemSample)}
            editMode={editMode}
            coordinates={coordinates}
          />
        )}
      </div>
    </RcTooltip>
  );
}
