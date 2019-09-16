import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import ReactTable, { Column } from "react-table";
import { LoadingSpinner, useQuery } from "../..";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../../types/seqdb-api";

interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
}

export function SampleLocationGrid({
  chain,
  sampleSelectionStep
}: ContainerGridProps) {
  const { loading: sampleSrLoading, response: sampleSrResponse } = useQuery<
    StepResource[]
  >({
    filter: {
      "chain.chainId": chain.id,
      "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id
    },
    include: "sample",
    path: "stepResource"
  });

  const mockContainer = {
    containerType: { numberOfColumns: 12, numberOfRows: 8 }
  };

  if (sampleSrLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (sampleSrResponse) {
    const samples = sampleSrResponse.data.map(sr => sr.sample);

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="row">
          <div className="col-3">
            <ul className="list-group">
              {samples.map(s => (
                <DraggableSampleBox sample={s} />
              ))}
            </ul>
          </div>
          <div className="col-9">
            <ContainerGrid container={mockContainer} />
          </div>
        </div>
      </DndProvider>
    );
  }
}

function DraggableSampleBox({ sample }) {
  const [, drag] = useDrag({
    item: { sample, type: "sample" }
  });

  return (
    <li ref={drag} className="list-group-item">
      {sample.name}
    </li>
  );
}

function ContainerGrid({ container }) {
  const [locations, setLocations] = useState<{ [key: string]: Sample }>({});

  const columns: Column[] = [];

  // Add the letter column.
  columns.push({
    Cell: ({ index }) => (
      <div style={{ padding: "7px 5px" }}>
        {String.fromCharCode(index + 65)}
      </div>
    ),
    Header: "",
    resizable: false,
    sortable: false
  });

  for (let col = 0; col < container.containerType.numberOfColumns; col++) {
    const columnLabel = col + 1;

    columns.push({
      Cell: ({ index: row }) => {
        const rowLabel = String.fromCharCode(row + 65);
        const coords = `${rowLabel}_${columnLabel}`;

        return (
          <GridCell
            sample={locations[coords]}
            onDrop={({ sample }) =>
              setLocations(locs => ({ ...locs, [coords]: sample }))
            }
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
      {sample && sample.name}
    </div>
  );
}
