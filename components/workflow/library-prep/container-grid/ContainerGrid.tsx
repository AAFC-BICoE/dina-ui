import { useDrop } from "react-dnd-cjs";
import ReactTable, { Column } from "react-table";
import { DraggableSampleBox } from "./DraggableSampleBox";

export function ContainerGrid({
  container,
  locations,
  onDrop = (sample, coords) => undefined
}) {
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
            onDrop={({ sample }) => onDrop(sample, coords)}
            sample={locations[coords]}
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

function GridCell({ onDrop, sample }) {
  const [, drop] = useDrop({
    accept: "sample",
    drop: item => onDrop(item)
  });

  return (
    <div ref={drop} className="h-100 w-100">
      {sample && <DraggableSampleBox sample={sample} selected={false} />}
    </div>
  );
}
