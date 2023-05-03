import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { SeqBatch } from "../../../../types/seqdb-api";
import {
  DraggableSeqReactionBox,
  ITEM_BOX_DRAG_KEY
} from "./DraggableSeqReactionBox";
import { useState, useEffect, useMemo } from "react";
import { SeqReactionSample } from "./useSeqSelectCoordinatesControls";
import RcTooltip from "rc-tooltip";

interface ContainerGridProps {
  seqBatch: SeqBatch;
  cellGrid: CellGrid;
  movedItems: SeqReactionSample[];
  onDrop: (item: SeqReactionSample, coords: string) => void;
  editMode: boolean;
}

interface GridCellProps {
  onDrop: (item: { seqReactionSample: SeqReactionSample }) => void;
  movedItems: SeqReactionSample[];
  seqReactionSample: SeqReactionSample;
  coordinates: string;
  editMode: boolean;
}

export interface CellGrid {
  [key: string]: SeqReactionSample;
}

export function ContainerGrid({
  seqBatch,
  cellGrid,
  movedItems,
  onDrop,
  editMode
}: ContainerGridProps) {
  const [numberOfRows, setNumberOfRows] = useState<number>(0);
  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  useEffect(() => {
    if (!seqBatch) return;

    if (seqBatch?.storageRestriction) {
      setNumberOfRows(seqBatch.storageRestriction.layout.numberOfRows);
      setNumberOfColumns(seqBatch.storageRestriction.layout.numberOfColumns);
    }
  }, [seqBatch]);

  // Generate table columns, only when the row/column number changes.
  const tableColumns: Column[] = useMemo(() => {
    const columns: Column[] = [];

    // Add the letter column.
    columns.push({
      Cell: ({ index }) => (
        <div style={{ padding: "7px 5px", textAlign: "center" }}>
          {String.fromCharCode(index + 65)}
        </div>
      ),
      resizable: false,
      sortable: false,
      width: 40,
      style: {
        background: "white",
        boxShadow: "11px 0px 9px 0px rgba(0,0,0,0.1)"
      }
    });

    for (let col = 0; col < numberOfColumns; col++) {
      const column = String(col + 1);
      const columnLabel = <div style={{ textAlign: "center" }}>{column}</div>;

      columns.push({
        Cell: ({ index: row }) => {
          const rowLabel = String.fromCharCode(row + 65);
          const coords = `${rowLabel}_${column}`;

          return (
            <span className={`well-${coords}`}>
              <GridCell
                movedItems={movedItems}
                onDrop={({ seqReactionSample: newItem }) =>
                  onDrop(newItem, coords)
                }
                seqReactionSample={cellGrid[coords]}
                editMode={editMode}
                coordinates={coords.replace("_", "")}
              />
            </span>
          );
        },
        Header: columnLabel,
        resizable: false,
        sortable: false
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
      <ReactTable
        columns={tableColumns}
        data={tableData}
        minRows={0}
        showPagination={false}
      />
    </div>
  );
}

function GridCell({
  onDrop,
  seqReactionSample,
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
      visible={(dragHover || hover) && seqReactionSample === undefined}
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
        {seqReactionSample && (
          <DraggableSeqReactionBox
            seqReactionSample={seqReactionSample}
            selected={false}
            wasMoved={movedItems.includes(seqReactionSample)}
            editMode={editMode}
            coordinates={coordinates}
          />
        )}
      </div>
    </RcTooltip>
  );
}
