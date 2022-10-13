import { useApiClient } from "packages/common-ui/lib";
import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { DraggablePCRBatchItemBox, ITEM_BOX_DRAG_KEY } from "./DraggablePCRBatchItemBox";

interface ContainerGridProps {
  pcrBatchId: string;
  cellGrid: CellGrid;
  movedItems: PcrBatchItem[];
  onDrop: (item: PcrBatchItem, coords: string) => void;
}

interface GridCellProps {
  onDrop: (item: { item: PcrBatchItem }) => void;
  movedItems: PcrBatchItem[];
  pcrBatchItem: PcrBatchItem;
}

export interface CellGrid {
  [key: string]: PcrBatchItem;
}

export function ContainerGrid({
  pcrBatchId,
  cellGrid,
  movedItems,
  onDrop
}: ContainerGridProps) {
  const { apiClient } = useApiClient();
  async function getPcrBatch(){
    const { data: pcrBatch } = await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${pcrBatchId}`,
      {}
    );
    return pcrBatch
  }
  const { pcrBatch } = getPcrBatch();
  const { numberOfRows } = pcrBatch.storageRestriction.gridLayout.numberOfRows;

  const columns: Column[] = [];

  // Add the letter column.
  columns.push({
    Cell: ({ index }) => (
      <div style={{ padding: "7px 5px" }}>
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
              onDrop={({ item: newSample }) => onDrop(newSample, coords)}
              pcrBatchItem={cellGrid[coords]}
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

function GridCell({ onDrop, pcrBatchItem, movedItems }: GridCellProps) {
  const [, drop] = useDrop({
    accept: ITEM_BOX_DRAG_KEY,
    drop: item => onDrop(item as any)
  });

  return (
    <div ref={drop} className="h-100 w-100">
      {pcrBatchItem && (
        <DraggablePCRBatchItemBox
        pcrBatchItem={pcrBatchItem}
          selected={false}
          wasMoved={movedItems.includes(pcrBatchItem)}
        />
      )}
    </div>
  );
}
