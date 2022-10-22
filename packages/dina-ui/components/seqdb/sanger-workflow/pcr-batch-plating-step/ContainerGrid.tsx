import { useApiClient } from "packages/common-ui/lib";
import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
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
}

interface GridCellProps {
  onDrop: (item: { pcrBatchItemSample: PcrBatchItemSample }) => void;
  movedItems: PcrBatchItemSample[];
  pcrBatchItemSample: PcrBatchItemSample;
}

export interface CellGrid {
  [key: string]: PcrBatchItemSample;
}

export function ContainerGrid({
  pcrBatchId,
  cellGrid,
  movedItems,
  onDrop
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
      <div style={{ padding: "7px 5px", alignContent: "center" }}>
        {String.fromCharCode(index + 65)}
      </div>
    ),
    resizable: false,
    sortable: false
  });

  for (let col = 0; col < numberOfRows; col++) {
    const columnLabel = String(col + 1);

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

function GridCell({ onDrop, pcrBatchItemSample, movedItems }: GridCellProps) {
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
        />
      )}
    </div>
  );
}
