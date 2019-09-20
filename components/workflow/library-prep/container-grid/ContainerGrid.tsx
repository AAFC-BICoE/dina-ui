import { noop } from "lodash";
import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { Container, Sample } from "../../../../types/seqdb-api";
import { DraggableSampleBox } from "./DraggableSampleBox";

interface ContainerGridProps {
  container: Container;
  cellGrid: CellGrid;
  onDrop: (sample: Sample, coords: string) => void;
}

interface GridCellProps {
  onDrop: (item: { sample: Sample }) => void;
  sample: Sample;
}

export interface CellGrid {
  [key: string]: Sample;
}

export function ContainerGrid({
  container,
  cellGrid,
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

  for (let col = 0; col < container.containerType.numberOfColumns; col++) {
    const columnLabel = String(col + 1);

    columns.push({
      Cell: ({ index: row }) => {
        const rowLabel = String.fromCharCode(row + 65);
        const coords = `${rowLabel}_${columnLabel}`;

        return (
          <GridCell
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
  for (let i = 0; i < container.containerType.numberOfRows; i++) {
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

function GridCell({ onDrop, sample }: GridCellProps) {
  const [, drop] = useDrop({
    accept: "sample",
    drop: item => onDrop(item as any)
  });

  return (
    <div ref={drop} className="h-100 w-100">
      {sample && <DraggableSampleBox sample={sample} selected={false} />}
    </div>
  );
}
