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
  const { apiClient, save } = useContext(ApiClientContext);

  const [samplesLoading, setSamplesLoading] = useState<boolean>(true);

  // Highlighted/selected samples.
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);

  // Available samples with no well coordinates.
  const [availableSampleList, setAvailableSampleList] = useState<Sample[]>([]);

  // The grid of samples that have well coordinates.
  const [cellGrid, setCellGrid] = useState<CellGrid>();

  // Samples that have been moved since data initialization.
  const [movedSamples, setMovedSamples] = useState<Sample[]>([]);

  const [lastSave, setLastSave] = useState<number>();

  const {
    loading: libraryPrepsLoading,
    response: libraryPrepsResponse
  } = useQuery<LibraryPrep[]>(
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
      deps: [lastSave],
      onSuccess: async ({ data: libraryPreps }) => {
        setSamplesLoading(true);

        const sampleIdsWithCoords = libraryPreps
          .filter(prep => prep.wellRow && prep.wellColumn)
          .map(prep => prep.sample.id)
          .join();

        const newCellGrid: CellGrid = {};
        for (const { wellRow, wellColumn, sample } of libraryPreps) {
          newCellGrid[`${wellRow}_${wellColumn}`] = sample;
        }
        setCellGrid(newCellGrid);
        setMovedSamples([]);

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
        setAvailableSampleList(samples => [...samples, sample]);
      }

      if (!movedSamples.includes(sample)) {
        setMovedSamples(samples => [...samples, sample]);
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

    async function gridSubmit() {
      try {
        const existingLibraryPreps = libraryPrepsResponse.data;

        const libraryPrepsToSave = movedSamples.map(movedSample => {
          // Get the coords from the cell grid.
          const coords = Object.keys(cellGrid).find(
            key => cellGrid[key] === movedSample
          );

          // Get this sample's library prep, or create a new one if it doesn't exist yet.
          const libraryPrep: LibraryPrep = existingLibraryPreps.find(
            prep => prep.sample.id === movedSample.id
          ) || {
            libraryPrepBatch,
            sample: movedSample,
            type: "libraryPrep"
          };

          let newWellColumn: number = null;
          let newWellRow: string = null;
          if (coords) {
            const [row, col] = coords.split("_");
            newWellColumn = Number(col);
            newWellRow = row;
          }

          libraryPrep.wellColumn = newWellColumn;
          libraryPrep.wellRow = newWellRow;

          return libraryPrep;
        });

        const saveArgs = libraryPrepsToSave.map(prep => ({
          resource: prep,
          type: "libraryPrep"
        }));

        await save(saveArgs);

        setLastSave(Date.now());
      } catch (err) {
        alert(err);
      }
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="row">
          <div className="col-3">
            <DraggableSampleList
              availableSamples={availableSampleList}
              selectedSamples={selectedSamples}
              movedSamples={movedSamples}
              onClick={onSampleClick}
              onDrop={onListDrop}
            />
          </div>
          <div className="col-8">
            <ContainerGrid
              containerType={libraryPrepBatch.containerType}
              cellGrid={cellGrid}
              movedSamples={movedSamples}
              onDrop={onGridDrop}
            />
          </div>
          <div className="col-1">
            <button
              className="btn btn-primary"
              onClick={gridSubmit}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      </DndProvider>
    );
  }
}
