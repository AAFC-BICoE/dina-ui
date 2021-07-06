import { ApiClientContext, useQuery } from "common-ui";
import { omitBy } from "lodash";
import { useContext, useRef, useState } from "react";
import {
  Chain,
  ChainStepTemplate,
  ContainerType,
  LibraryPrep,
  LibraryPrepBatch,
  MolecularSample
} from "../../../../../types/seqdb-api";
import { CellGrid } from "./ContainerGrid";

interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
  libraryPrepBatch: LibraryPrepBatch;
}

interface SampleStepResource {
  molecularSample: MolecularSample;
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
  const [selectedSamples, setSelectedSamples] = useState<MolecularSample[]>([]);
  const lastSelectedSampleRef = useRef<MolecularSample>();

  // Grid fill direction when you move multiple samples into the grid.
  const [fillMode, setFillMode] = useState<string>("COLUMN");

  const [lastSave, setLastSave] = useState<number>();

  const [gridState, setGridState] = useState({
    // Available samples with no well coordinates.
    availableSamples: [] as MolecularSample[],
    // The grid of samples that have well coordinates.
    cellGrid: {} as CellGrid,
    // Samples that have been moved since data initialization.
    movedSamples: [] as MolecularSample[]
  });

  // Library prep and sample queries.
  const { loading: libraryPrepsLoading, response: libraryPrepsResponse } =
    useQuery<LibraryPrep[]>(
      {
        // Optimize query speed by reducing the amount of requested fields.
        fields: {
          "molecular-sample": "name"
        },
        include: "molecularSample",
        page: { limit: 1000 },
        path: `seqdb-api/library-prep-batch/${libraryPrepBatch.id}/libraryPreps`
      },
      {
        deps: [lastSave],
        onSuccess: async ({ data: libraryPreps }) => {
          setSamplesLoading(true);

          const libraryPrepsWithCoords = libraryPreps.filter(
            prep => prep.wellRow && prep.wellColumn
          );

          const newCellGrid: CellGrid = {};
          for (const {
            wellRow,
            wellColumn,
            molecularSample
          } of libraryPrepsWithCoords) {
            newCellGrid[`${wellRow}_${wellColumn}`] = molecularSample;
          }

          const sampleIdsWithCoords = libraryPrepsWithCoords
            .map(prep => prep.molecularSample.id)
            .join();

          const { data: selectionStepSrsNoCoords } = await apiClient.get<
            SampleStepResource[]
          >("seqdb-api/step-resource", {
            // Get all the sample stepResources from the sample selection step that have no coords.
            fields: {
              "molecular-sample": "name"
            },
            filter: {
              "chain.uuid": chain.id as string,
              "chainStepTemplate.uuid": sampleSelectionStep.id as string,
              rsql: `molecularSample.uuid=out=(${
                sampleIdsWithCoords || "00000000-0000-0000-0000-000000000000"
              })`
            },
            include: "molecularSample",
            page: { limit: 1000 }
          });

          const newAvailableSamples = selectionStepSrsNoCoords
            .map(sr => sr.molecularSample)
            .sort(sampleSort);

          setGridState({
            availableSamples: newAvailableSamples,
            cellGrid: newCellGrid,
            movedSamples: []
          });
          setSamplesLoading(false);
        }
      }
    );

  function moveSamples(samples: MolecularSample[], coords?: string) {
    setGridState(({ availableSamples, cellGrid, movedSamples }) => {
      // Remove the sample from the grid.
      const newCellGrid: CellGrid = omitBy(cellGrid, s => samples.includes(s));

      // Remove the sample from the availables samples.
      let newAvailableSamples = availableSamples.filter(
        s => !samples.includes(s)
      );
      const newMovedSamples = [...movedSamples];

      if (coords) {
        const [rowLetter, colNumberString] = coords.split("_");
        const rowNumber = rowLetter.charCodeAt(0) - 64;
        const { numberOfColumns, numberOfRows } =
          libraryPrepBatch.containerType as ContainerType;

        let newCellNumber =
          fillMode === "ROW"
            ? (rowNumber - 1) * numberOfColumns + Number(colNumberString)
            : (Number(colNumberString) - 1) * numberOfRows + rowNumber;

        for (const sample of samples) {
          let thisSampleRowNumber = -1;
          let thisSampleColumnNumber = -1;

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

          // If there is already a sample in this cell, move the existing sample back to the list.
          const sampleAlreadyInThisCell = newCellGrid[thisSampleCoords];
          if (sampleAlreadyInThisCell) {
            newAvailableSamples.push(sampleAlreadyInThisCell);
            if (!movedSamples.includes(sampleAlreadyInThisCell)) {
              newMovedSamples.push(sampleAlreadyInThisCell);
            }
          }

          // Only move the sample into the grid if the well is valid for this container type.
          if (newCellNumber <= numberOfColumns * numberOfRows) {
            // Move the sample into the grid.
            newCellGrid[thisSampleCoords] = sample;
          } else {
            newAvailableSamples.push(sample);
          }

          newCellNumber++;
        }
      } else {
        // Add the sample to the list.
        newAvailableSamples = [...newAvailableSamples, ...samples];
      }

      // Set every sample passed into this function as moved.
      for (const sample of samples) {
        if (!movedSamples.includes(sample)) {
          newMovedSamples.push(sample);
        }
      }

      return {
        availableSamples: newAvailableSamples.sort(sampleSort),
        cellGrid: newCellGrid,
        movedSamples: newMovedSamples
      };
    });

    setSelectedSamples([]);
  }

  function onGridDrop(sample: MolecularSample, coords: string) {
    if (selectedSamples.includes(sample)) {
      moveSamples(selectedSamples, coords);
    } else {
      moveSamples([sample], coords);
    }
  }

  function onListDrop(sample: MolecularSample) {
    moveSamples([sample]);
  }

  function onSampleClick(sample, e) {
    const { availableSamples } = gridState;

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
      const { cellGrid, movedSamples } = gridState;
      const existingLibraryPreps = libraryPrepsResponse
        ? libraryPrepsResponse.data
        : [];

      const libraryPrepsToSave = movedSamples.map(movedSample => {
        // Get the coords from the cell grid.
        const coords = Object.keys(cellGrid).find(
          key => cellGrid[key] === movedSample
        );

        // Get this sample's library prep, or create a new one if it doesn't exist yet.
        const existingPrep = existingLibraryPreps.find(
          prep => prep.molecularSample.id === movedSample.id
        );
        const libraryPrep: LibraryPrep = existingPrep
          ? { ...existingPrep }
          : {
              libraryPrepBatch,
              molecularSample: movedSample,
              type: "library-prep"
            };

        let newWellColumn: number | null = null;
        let newWellRow: string | null = null;
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
        type: "library-prep"
      }));

      await save(saveArgs, { apiBaseUrl: "/seqdb-api" });

      setLastSave(Date.now());
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
  }

  function clearGrid() {
    moveSamples(Object.values(gridState.cellGrid));
  }

  async function moveAll() {
    const { availableSamples, cellGrid } = gridState;
    const samples = [...availableSamples, ...Object.values(cellGrid)].sort(
      sampleSort
    );
    moveSamples(samples, "A_1");
  }

  const loading = libraryPrepsLoading || samplesLoading || submitting;

  return {
    ...gridState,
    clearGrid,
    fillMode,
    gridSubmit,
    loading,
    moveAll,
    onGridDrop,
    onListDrop,
    onSampleClick,
    selectedSamples,
    setFillMode
  };
}

function sampleSort(a, b) {
  const [[aAlpha, aNum], [bAlpha, bNum]] = [a, b].map(
    s => s.name.match(/[^\d]+|\d+/g) || []
  );

  if (aAlpha === bAlpha) {
    return Number(aNum) > Number(bNum) ? 1 : -1;
  } else {
    return aAlpha > bAlpha ? 1 : -1;
  }
}
