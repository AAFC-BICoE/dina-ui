import { noop } from "lodash";
import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { ContainerType, Sample } from "../../../../types/seqdb-api";
import { DraggableSampleBox } from "./DraggableSampleBox";

interface ContainerGridProps {
  containerType: ContainerType;
  cellGrid: CellGrid;
  movedSamples: Sample[];
  onDrop: (sample: Sample, coords: string) => void;
}

interface GridCellProps {
  onDrop: (item: { sample: Sample }) => void;
  movedSamples: Sample[];
  sample: Sample;
}

export interface CellGrid {
  [key: string]: Sample;
}

export function ContainerGrid({
  containerType,
  cellGrid,
  movedSamples,
  onDrop = noop
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
          <GridCell
            movedSamples={movedSamples}
            onDrop={({ sample: newSample }) => onDrop(newSample, coords)}
            sample={cellGrid[coords]}
          />
        );
      },
      Header: columnLabel,
      resizable: false,
      sortable: false
    });
  }

  const tableData = [];
  for (let i = 0; i < containerType.numberOfRows; i++) {
    tableData.push({});
  }

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
    accept: "sample",
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
