import { useContext, useRef, useState } from "react";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import { ApiClientContext, LoadingSpinner, useQuery } from "../../..";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrep,
  LibraryPrepBatch,
  Sample
} from "../../../../types/seqdb-api";
import { CellGrid, ContainerGrid } from "./ContainerGrid";
import { DraggableSampleList } from "./DraggableSampleList";

interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
  libraryPrepBatch: LibraryPrepBatch;
}

export function SampleLocationGrid({
  chain,
  sampleSelectionStep,
  libraryPrepBatch
}: ContainerGridProps) {
  const { apiClient } = useContext(ApiClientContext);

  const [availableSampleList, setAvailableSampleList] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [cellGrid, setCellGrid] = useState<CellGrid>();
  const [samplesLoading, setSamplesLoading] = useState<boolean>(true);

  const { loading: libraryPrepsLoading } = useQuery<LibraryPrep[]>(
    {
      // Optimize query speed by reducing the amount of requested fields.
      fields: {
        sample: "name"
      },
      include: "sample",
      page: { limit: 1000 },
      path: `libraryPrepBatch/${libraryPrepBatch.id}/libraryPreps`
    },
    {
      onSuccess: async response => {
        const libraryPreps = response.data;

        const sampleIdsWithCoords = libraryPreps
          .filter(prep => prep.wellRow && prep.wellColumn)
          .map(prep => prep.sample.id)
          .join();

        const newCellGrid: CellGrid = {};
        for (const { wellRow, wellColumn, sample } of libraryPreps) {
          newCellGrid[`${wellRow}_${wellColumn}`] = sample;
        }

        const { data: selectionStepSrs } = await apiClient.get("stepResource", {
          // Get all the sample stepResources from the sample selection step that have no coords.
          filter: {
            "chain.chainId": chain.id,
            "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id,
            rsql: `sample.sampleId=out=(${sampleIdsWithCoords || "0"})`
          },
          include: "sample",
          page: { limit: 1000 }
        });

        const availableSamples = selectionStepSrs
          .map(sr => sr.sample)
          .filter(({ id }) => !sampleIdsWithCoords.includes(id));

        setCellGrid(newCellGrid);
        setAvailableSampleList(availableSamples);
        setSamplesLoading(false);
      }
    }
  );

  const lastSelectedSampleRef = useRef<Sample>();

  if (samplesLoading || libraryPrepsLoading) {
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
            <ContainerGrid
              containerType={libraryPrepBatch.containerType}
              cellGrid={cellGrid}
              onDrop={onGridDrop}
            />
          </div>
        </div>
      </DndProvider>
    );
  }
}
