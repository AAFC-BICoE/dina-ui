import { useMemo, useRef, useState } from "react";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import { LoadingSpinner, ResourceSelect, useQuery } from "../../..";
import {
  Chain,
  ChainStepTemplate,
  Container,
  Location,
  Sample,
  StepResource
} from "../../../../types/seqdb-api";
import { filterBy } from "../../../../util/rsql";
import { CellGrid, ContainerGrid } from "./ContainerGrid";
import { DraggableSampleList } from "./DraggableSampleList";

interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
}

export function SampleLocationGrid({
  chain,
  sampleSelectionStep
}: ContainerGridProps) {
  const [availableSampleList, setAvailableSampleList] = useState<Sample[]>([]);
  const [container, setContainer] = useState<Container>();
  const [cellGrid, setCellGrid] = useState<CellGrid>({});

  const { loading: sampleSrLoading } = useQuery<StepResource[]>(
    {
      filter: {
        "chain.chainId": chain.id,
        "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id
      },
      include: "sample,sample.location",
      page: { limit: 1000 },
      path: "stepResource"
    },
    {
      onSuccess: sampleSrResponse => {
        const newSamples = sampleSrResponse.data
          .map(sr => sr.sample)
          // Filter to just the samples without a location.
          .filter(sample => !sample.location);

        setAvailableSampleList(newSamples);
      }
    }
  );

  const { loading: locationsLoading } = useQuery<Location[]>(
    {
      include: "sample",
      page: { limit: 1000 },
      path: container ? `container/${container.id}/locations` : ""
    },
    {
      onSuccess: response => {
        const locations = response.data;
        const newCellGrid: CellGrid = {};
        for (const location of locations) {
          newCellGrid[`${location.wellRow}_${location.wellColumn}`] =
            location.sample;
        }
        setCellGrid(newCellGrid);
      }
    }
  );

  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const lastSelectedSampleRef = useRef<Sample>();

  if (sampleSrLoading || locationsLoading) {
    return <LoadingSpinner loading={true} />;
  } else {
    function onGridDrop(sample, coords) {
      // Remove the sample from the sample list:
      if (availableSampleList.includes(sample)) {
        availableSampleList.splice(availableSampleList.indexOf(sample), 1);
      }

      // Remove the sample from the grid.
      for (const attr in cellGrid) {
        if (cellGrid[attr] === sample) {
          setCellGrid(locs => ({ ...locs, [attr]: undefined }));
        }
      }

      // Add the sample to the grid state.
      setCellGrid(locs => ({ ...locs, [coords]: sample }));
    }

    function onSampleClick(sample, e) {
      if (lastSelectedSampleRef.current && e.shiftKey) {
        const currentIndex = availableSampleList.indexOf(sample);
        const lastIndex = availableSampleList.indexOf(
          lastSelectedSampleRef.current
        );

        const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
          (a, b) => a - b
        );

        const newSelectedSamples = availableSampleList.slice(
          lowIndex,
          highIndex + 1
        );

        setSelectedSamples(newSelectedSamples);
      } else {
        setSelectedSamples([sample]);
      }

      lastSelectedSampleRef.current = sample;
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="row">
          <div className="col-3">
            <DraggableSampleList
              availableSamples={availableSampleList}
              selectedSamples={selectedSamples}
              onClick={onSampleClick}
            />
          </div>
          <div className="col-9">
            <strong>Container:</strong>
            <ResourceSelect<Container>
              include="containerType,group"
              filter={filterBy(["containerNumber"])}
              model="container"
              optionLabel={c =>
                `${c.containerNumber}${c.group && ` (${c.group.groupName})`}`
              }
              onChange={(c: Container) => setContainer(c)}
              value={container}
            />
            {container && (
              <ContainerGrid
                container={container}
                cellGrid={cellGrid}
                onDrop={onGridDrop}
              />
            )}
          </div>
        </div>
      </DndProvider>
    );
  }
}
