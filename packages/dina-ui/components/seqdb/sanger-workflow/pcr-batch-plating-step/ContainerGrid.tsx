import { useApiClient } from "packages/common-ui/lib";
import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { PcrBatch } from "../../../../types/seqdb-api";
import {
  DraggablePCRBatchItemBox,
  ITEM_BOX_DRAG_KEY
} from "./DraggablePCRBatchItemBox";
import { useState, useEffect } from "react";
import { PcrBatchItemSample } from "./usePCRBatchItemGridControls";

interface ContainerGridProps {
  pcrBatchId: string;
  cellGrid: CellGrid;
  movedItems: PcrBatchItemSample[];
  onDrop: (item: PcrBatchItemSample, coords: string) => void;
  editMode: boolean;
}

interface GridCellProps {
  onDrop: (item: { pcrBatchItemSample: PcrBatchItemSample }) => void;
  movedItems: PcrBatchItemSample[];
  pcrBatchItemSample: PcrBatchItemSample;
  editMode: boolean;
}

export interface CellGrid {
  [key: string]: PcrBatchItemSample;
}

export function ContainerGrid({
  pcrBatchId,
  cellGrid,
  movedItems,
  onDrop,
  editMode
}: ContainerGridProps) {
  const { apiClient } = useApiClient();
  const [pcrBatch, setPcrBatch] = useState<PcrBatch>();
  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  async function getPcrBatch() {
    await apiClient
      .get<PcrBatch>(`seqdb-api/pcr-batch/${pcrBatchId}`, {})
      .then((response) => {
        setPcrBatch(response?.data);
      });
  }

  useEffect(() => {
    getPcrBatch();
  }, []);

  useEffect(() => {
    if (!pcrBatch) return;

    if (pcrBatch?.storageRestriction) {
      setNumberOfRows(pcrBatch.storageRestriction.layout.numberOfRows);
    }
  }, [pcrBatch]);

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

  for (let col = 0; col < numberOfRows; col++) {
    const columnLabel = (
      <div style={{ textAlign: "center" }}>{String(col + 1)}</div>
    );

    columns.push({
      Cell: ({ index: row }) => {
        const rowLabel = String.fromCharCode(row + 65);
        const coords = `${rowLabel}_${columnLabel}`;

        return (
          <span className={`well-${coords}`}>
            <GridCell
              movedItems={movedItems}
              onDrop={({ pcrBatchItemSample: newItem }) =>
                onDrop(newItem, coords)
              }
              pcrBatchItemSample={cellGrid[coords]}
              editMode={editMode}
            />
          </span>
        );
      },
      Header: columnLabel,
      resizable: false,
      sortable: false
    });
  }

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
        columns={columns}
        data={tableData}
        minRows={0}
        showPagination={false}
      />
    </div>
  );
}

function GridCell({
  onDrop,
  pcrBatchItemSample,
  movedItems,
  editMode
}: GridCellProps) {
  const [, drop] = useDrop({
    accept: ITEM_BOX_DRAG_KEY,
    drop: (item) => {
      onDrop(item as any);
    }
  });

  return (
    <div ref={drop} className="h-100 w-100">
      {pcrBatchItemSample && (
        <DraggablePCRBatchItemBox
          pcrBatchItemSample={pcrBatchItemSample}
          selected={false}
          wasMoved={movedItems.includes(pcrBatchItemSample)}
          editMode={editMode}
        />
      )}
    </div>
  );
}
