import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { ContainerType } from "../../../../types/seqdb-api";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { DraggableSampleBox, SAMPLE_BOX_DRAG_KEY } from "./DraggableSampleBox";

interface ContainerGridProps {
  containerType: ContainerType;
  cellGrid: CellGrid;
  movedSamples: MaterialSample[];
  onDrop: (sample: MaterialSample, coords: string) => void;
}

interface GridCellProps {
  onDrop: (item: { sample: MaterialSample }) => void;
  movedSamples: MaterialSample[];
  sample: MaterialSample;
}

export interface CellGrid {
  [key: string]: MaterialSample;
}

export function ContainerGrid({
  containerType,
  cellGrid,
  movedSamples,
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

        // return (
        //   <span className={`well-${coords}`}>
        //     <GridCell
        //       movedSamples={movedSamples}
        //       onDrop={({ sample: newSample }) => onDrop(newSample, coords)}
        //       sample={cellGrid[coords]}
        //     />
        //   </span>
        // );
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

function GridCell({ onDrop, sample, movedSamples }: GridCellProps) {
  const [, drop] = useDrop({
    accept: SAMPLE_BOX_DRAG_KEY,
    drop: item => onDrop(item as any)
  });

  return (
    <div ref={drop} className="h-100 w-100">
      {sample && (
        <DraggableSampleBox
          sample={sample}
          selected={false}
          wasMoved={movedSamples.includes(sample)}
        />
      )}
    </div>
  );
}
