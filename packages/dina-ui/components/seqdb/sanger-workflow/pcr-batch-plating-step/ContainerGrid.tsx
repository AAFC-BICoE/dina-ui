import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { ContainerType, PcrBatchItem } from "../../../../types/seqdb-api";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { DraggablePCRBatchItemBox, SAMPLE_BOX_DRAG_KEY } from "./DraggablePCRBatchItemBox";

interface ContainerGridProps {
  containerType: ContainerType;
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
  containerType,
  cellGrid,
  movedItems,
  onDrop
}: ContainerGridProps) {
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

  for (let col = 0; col < containerType.numberOfColumns; col++) {
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
  const tableData = new Array(containerType.numberOfRows).fill({});

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
    accept: SAMPLE_BOX_DRAG_KEY,
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
