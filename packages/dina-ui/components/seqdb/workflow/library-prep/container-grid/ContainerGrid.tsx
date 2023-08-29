import { useDrop } from "react-dnd-cjs";
import { ColumnDef } from "@tanstack/react-table";
import { ContainerType, MolecularSample } from "../../../../../types/seqdb-api";
import { DraggableSampleBox, SAMPLE_BOX_DRAG_KEY } from "./DraggableSampleBox";
import { FieldHeader, ReactTable } from "../../../../../../common-ui/";

interface ContainerGridProps {
  containerType: ContainerType;
  cellGrid: CellGrid;
  movedSamples: MolecularSample[];
  onDrop: (sample: MolecularSample, coords: string) => void;
}

interface GridCellProps {
  onDrop: (item: { sample: MolecularSample }) => void;
  movedSamples: MolecularSample[];
  sample: MolecularSample;
}

export interface CellGrid {
  [key: string]: MolecularSample;
}

export function ContainerGrid({
  containerType,
  cellGrid,
  movedSamples,
  onDrop
}: ContainerGridProps) {
  const columns: ColumnDef<MolecularSample>[] = [];

  // Add the letter column.
  columns.push({
    id: "col-index",
    cell: ({ row: { index } }) => (
      <div style={{ padding: "7px 5px" }}>
        {String.fromCharCode(index + 65)}
      </div>
    ),
    enableSorting: false
  });

  for (let col = 0; col < containerType.numberOfColumns; col++) {
    const columnLabel = String(col + 1);

    columns.push({
      id: `col-${columnLabel}`,
      cell: ({ row: { index } }) => {
        const rowLabel = String.fromCharCode(index + 65);
        const coords = `${rowLabel}_${columnLabel}`;

        return (
          <div className={`well-${coords}`} style={{ height: "40px" }}>
            <GridCell
              movedSamples={movedSamples}
              onDrop={({ sample: newSample }) => onDrop(newSample, coords)}
              sample={cellGrid[coords]}
            />
          </div>
        );
      },
      header: () => <FieldHeader name={columnLabel} />,
      enableSorting: false,
      size: 150
    });
  }

  // ReactTable needs a data object in every row.
  const tableData = new Array(containerType.numberOfRows).fill({});

  return (
    <div>
      <style>{`
        .ReactTable td {
          padding: 0 !important;
        }
      `}</style>
      <ReactTable<MolecularSample>
        columns={columns}
        data={tableData}
        showPagination={false}
      />
    </div>
  );
}

function GridCell({ onDrop, sample, movedSamples }: GridCellProps) {
  const [, drop] = useDrop({
    accept: SAMPLE_BOX_DRAG_KEY,
    drop: (item) => onDrop(item as any)
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
