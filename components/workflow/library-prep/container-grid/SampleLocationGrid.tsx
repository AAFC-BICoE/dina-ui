import { useContext, useRef, useState } from "react";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import {
  ApiClientContext,
  LoadingSpinner,
  ResourceSelect,
  useQuery
} from "../../..";
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
  const { apiClient } = useContext(ApiClientContext);

  const [availableSampleList, setAvailableSampleList] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [containerLoading, setContainerLoading] = useState(true);
  const [container, setContainer] = useState<Container>();
  const [cellGrid, setCellGrid] = useState<CellGrid>({});

  const { loading: sampleSrLoading } = useQuery<StepResource[]>(
    {
      filter: {
        "chain.chainId": chain.id,
        "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id
      },
      include: "sample,sample.location,sample.location.container",
      page: { limit: 1000 },
      path: "stepResource"
    },
    {
      onSuccess: async sampleSrResponse => {
        const newSamples = sampleSrResponse.data
          .map(sr => sr.sample)
          // Filter to just the samples without a location.
          .filter(sample => !sample.location);

        setAvailableSampleList(newSamples);

        // Figure out what container these samples are in.
        for (const sr of sampleSrResponse.data) {
          if (sr.sample && sr.sample.location) {
            const newContainer = await apiClient.get(
              `location/${sr.sample.location.id}/container`,
              {
                include: "containerType,group"
              }
            );
            setContainer(newContainer.data);
            break;
          }
        }

        setContainerLoading(false);
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

  const lastSelectedSampleRef = useRef<Sample>();

  if (sampleSrLoading || locationsLoading || containerLoading) {
    return <LoadingSpinner loading={true} />;
  } else {
    function moveSample(sample: Sample, coords: string) {
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

      if (coords) {
        // Add the sample to the grid state.
        setCellGrid(locs => ({ ...locs, [coords]: sample }));
      } else {
        // Add the sample to the list.
        setAvailableSampleList([...availableSampleList, sample]);
      }
    }

    function onGridDrop(sample, coords) {
      moveSample(sample, coords);
    }

    function onListDrop(sample: Sample) {
      moveSample(sample, null);
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
              onDrop={onListDrop}
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
            {container && container.id && (
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
