import { useMemo, useRef, useState } from "react";
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
    page: { limit: 1000 },
    path: "stepResource"
  });

  const availableSampleList = useMemo(() => {
    if (sampleSrResponse) {
      return sampleSrResponse.data.map(sr => sr.sample);
    } else {
      return [];
    }
  }, [sampleSrResponse]);

  const mockContainer = {
    containerType: { numberOfColumns: 12, numberOfRows: 8 }
  };

  const [locations, setLocations] = useState<{ [key: string]: Sample }>({});
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const lastSelectedSampleRef = useRef<Sample>();

  if (sampleSrLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (sampleSrResponse) {
    function onGridDrop(sample, coords) {
      // Remove the sample from the sample list:
      if (availableSampleList.includes(sample)) {
        availableSampleList.splice(availableSampleList.indexOf(sample), 1);
      }

      // Remove the sample from the grid.
      for (const attr in locations) {
        if (locations[attr] === sample) {
          setLocations(locs => ({ ...locs, [attr]: undefined }));
        }
      }

      // Add the sample to the grid state.
      setLocations(locs => ({ ...locs, [coords]: sample }));
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="row">
          <div className="col-3">
            <ul className="list-group">
              {availableSampleList.map(s => {
                function onClick(e) {
                  if (lastSelectedSampleRef.current && e.shiftKey) {
                    const currentIndex = availableSampleList.indexOf(s);
                    const lastIndex = availableSampleList.indexOf(
                      lastSelectedSampleRef.current
                    );

                    const [lowIndex, highIndex] = [
                      currentIndex,
                      lastIndex
                    ].sort((a, b) => a - b);

                    const newSelectedSamples = availableSampleList.slice(
                      lowIndex,
                      highIndex + 1
                    );

                    setSelectedSamples(newSelectedSamples);
                  } else {
                    setSelectedSamples([s]);
                  }

                  lastSelectedSampleRef.current = s;
                }

                return (
                  <DraggableSampleBox
                    key={s.id}
                    sample={s}
                    onClick={onClick}
                    selected={selectedSamples.includes(s)}
                  />
                );
              })}
            </ul>
          </div>
          <div className="col-9">
            <ContainerGrid
              container={mockContainer}
              locations={locations}
              onDrop={onGridDrop}
            />
          </div>
        </div>
      </DndProvider>
    );
  }
}

function DraggableSampleBox({ onClick = e => undefined, sample, selected }) {
  const [, drag] = useDrag({
    item: { sample, type: "sample" }
  });

  return (
    <li
      className="list-group-item"
      onClick={onClick}
      ref={drag}
      style={{
        backgroundColor: selected && "rgb(222, 252, 222)",
        cursor: "move"
      }}
    >
      {sample.name}
    </li>
  );
}

function ContainerGrid({
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
