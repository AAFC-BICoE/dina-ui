import { useDrop } from "react-dnd-cjs";
import { ColumnDef } from "@tanstack/react-table";
import { PcrBatch } from "../../../../types/seqdb-api";
import {
  DraggablePCRBatchItemBox,
  ITEM_BOX_DRAG_KEY
} from "./DraggablePCRBatchItemBox";
import { useState, useEffect, useMemo } from "react";
import { PcrBatchItemSample } from "./usePCRBatchItemGridControls";
import RcTooltip from "rc-tooltip";
import { ReactTable8 } from "packages/common-ui/lib";

interface ContainerGridProps {
  pcrBatch: PcrBatch;
  cellGrid: CellGrid;
  movedItems: PcrBatchItemSample[];
  onDrop: (item: PcrBatchItemSample, coords: string) => void;
  editMode: boolean;
}

interface GridCellProps {
  onDrop: (item: { pcrBatchItemSample: PcrBatchItemSample }) => void;
  movedItems: PcrBatchItemSample[];
  pcrBatchItemSample: PcrBatchItemSample;
  coordinates: string;
  editMode: boolean;
}

export interface CellGrid {
  [key: string]: PcrBatchItemSample;
}

export function ContainerGrid({
  pcrBatch,
  cellGrid,
  movedItems,
  onDrop,
  editMode
}: ContainerGridProps) {
  const [numberOfRows, setNumberOfRows] = useState<number>(0);
  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  useEffect(() => {
    if (!pcrBatch) return;

    if (pcrBatch?.storageRestriction) {
      setNumberOfRows(pcrBatch.storageRestriction.layout.numberOfRows);
      setNumberOfColumns(pcrBatch.storageRestriction.layout.numberOfColumns);
    }
  }, [pcrBatch]);

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
          background: "white",
          boxShadow: "11px 0px 9px 0px rgba(0,0,0,0.1)"
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
            <span className={`well-${coords}`}>
              <GridCell
                movedItems={movedItems}
                onDrop={({ pcrBatchItemSample: newItem }) =>
                  onDrop(newItem, coords)
                }
                pcrBatchItemSample={cellGrid[coords]}
                editMode={editMode}
                coordinates={coords.replace("_", "")}
              />
            </span>
          );
        },
        header: () => columnLabel,
        enableSorting: false
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
      `}</style>
      <ReactTable8<any>
        columns={tableColumns}
        data={tableData}
        showPagination={false}
      />
    </div>
  );
}

function GridCell({
  onDrop,
  pcrBatchItemSample,
  coordinates,
  movedItems,
  editMode
}: GridCellProps) {
  const [hover, setHover] = useState<boolean>(false);

  const [{ dragHover }, drop] = useDrop({
    accept: ITEM_BOX_DRAG_KEY,
    drop: (item) => {
      onDrop(item as any);
    },
    collect: (monitor) => ({
      dragHover: monitor.isOver()
    })
  });

  return (
    <RcTooltip
      placement="top"
      trigger={"hover"}
      visible={(dragHover || hover) && pcrBatchItemSample === undefined}
      overlay={<div style={{ maxWidth: "15rem" }}>{coordinates}</div>}
    >
      <div
        ref={drop}
        className="h-100 w-100"
        style={{
          border: dragHover ? "3px dashed #1C6EA4" : undefined,
          background: dragHover ? "#f7fbff" : undefined
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {pcrBatchItemSample && (
          <DraggablePCRBatchItemBox
            pcrBatchItemSample={pcrBatchItemSample}
            selected={false}
            wasMoved={movedItems.includes(pcrBatchItemSample)}
            editMode={editMode}
            coordinates={coordinates}
          />
        )}
      </div>
    </RcTooltip>
  );
}
