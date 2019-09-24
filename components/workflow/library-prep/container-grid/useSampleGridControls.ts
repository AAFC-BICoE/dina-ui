import { useContext, useRef, useState } from "react";
import { ApiClientContext, useQuery } from "../../..";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrep,
  LibraryPrepBatch,
  Sample
} from "../../../../types/seqdb-api";
import { CellGrid } from "./ContainerGrid";

interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
  libraryPrepBatch: LibraryPrepBatch;
}

export function useSampleGridControls({
  chain,
  libraryPrepBatch,
  sampleSelectionStep
}: ContainerGridProps) {
  const { apiClient, save } = useContext(ApiClientContext);

  const [samplesLoading, setSamplesLoading] = useState<boolean>(true);

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected samples.
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const lastSelectedSampleRef = useRef<Sample>();

  // Available samples with no well coordinates.
  const [availableSamples, setAvailableSamples] = useState<Sample[]>([]);

  // The grid of samples that have well coordinates.
  const [cellGrid, setCellGrid] = useState<CellGrid>();

  // Grid fill direction when you move multiple samples into the grid.
  const [fillMode, setFillMode] = useState<string>("COLUMN");

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

        const newAvailableSamples = selectionStepSrs
          .map(sr => sr.sample)
          .filter(({ id }) => !sampleIdsWithCoords.includes(id));

        setAvailableSamples(newAvailableSamples);
        setSamplesLoading(false);
      }
    }
  );

  function moveSample(sample: Sample, coords: string) {
    // Remove the sample from the sample list:
    if (availableSamples.includes(sample)) {
      availableSamples.splice(availableSamples.indexOf(sample), 1);
    }

    // Remove the sample from the grid.
    for (const attr in cellGrid) {
      if (cellGrid[attr] === sample) {
        setCellGrid(locs => ({ ...locs, [attr]: undefined }));
      }
    }

    if (coords) {
      // Add the sample to the grid state.
      setCellGrid(newGrid => ({ ...newGrid, [coords]: sample }));
    } else {
      // Add the sample to the list.
      setAvailableSamples(samples => [...samples, sample]);
    }

    if (!movedSamples.includes(sample)) {
      setMovedSamples(samples => [...samples, sample]);
    }

    setSelectedSamples([]);
  }

  function onGridDrop(sample: Sample, coords: string) {
    if (selectedSamples.includes(sample) && selectedSamples.length > 1) {
      const [rowLetter, colNumberString] = coords.split("_");
      const rowNumber = rowLetter.charCodeAt(0) - 64;
      const { numberOfColumns, numberOfRows } = libraryPrepBatch.containerType;

      let newCellNumber =
        fillMode === "ROW"
          ? (rowNumber - 1) * numberOfColumns + Number(colNumberString)
          : (Number(colNumberString) - 1) * numberOfRows + rowNumber;

      for (const selectedSample of selectedSamples) {
        let thisSampleRowNumber: number;
        let thisSampleColumnNumber: number;

        if (fillMode === "ROW") {
          thisSampleRowNumber = Math.ceil(newCellNumber / numberOfColumns);
          thisSampleColumnNumber =
            newCellNumber % numberOfColumns || numberOfColumns;
        }
        if (fillMode === "COLUMN") {
          thisSampleColumnNumber = Math.ceil(newCellNumber / numberOfRows);
          thisSampleRowNumber = newCellNumber % numberOfRows || numberOfRows;
        }

        const thisSampleCoords = `${String.fromCharCode(
          thisSampleRowNumber + 64
        )}_${thisSampleColumnNumber}`;

        moveSample(selectedSample, thisSampleCoords);
        newCellNumber++;
      }
    } else {
      moveSample(sample, coords);
    }
  }

  function onListDrop(sample: Sample) {
    moveSample(sample, null);
  }

  function onSampleClick(sample, e) {
    if (lastSelectedSampleRef.current && e.shiftKey) {
      const currentIndex = availableSamples.indexOf(sample);
      const lastIndex = availableSamples.indexOf(lastSelectedSampleRef.current);

      const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
        (a, b) => a - b
      );

      const newSelectedSamples = availableSamples.slice(
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
    setSubmitting(true);
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
    setSubmitting(false);
  }

  const loading = libraryPrepsLoading || samplesLoading || submitting;

  return {
    availableSamples,
    cellGrid,
    fillMode,
    gridSubmit,
    loading,
    movedSamples,
    onGridDrop,
    onListDrop,
    onSampleClick,
    selectedSamples,
    setFillMode
  };
}
