import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  SaveArgs,
  useQuery,
  useStringComparator
} from "common-ui";
import { compact, isEmpty, omitBy } from "lodash";
import { MaterialSample, StorageUnit } from "../../../../types/collection-api";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StorageUnitUsage } from "../../../../types/collection-api/resources/StorageUnitUsage";
import { CellGrid } from "../../../../components/seqdb/container-grid/ContainerGrid";
import { SAMPLE_SELECTION_MATERIAL_SAMPLE_SORT_ORDER } from "../StorageUnitSampleSelectionStep";

interface MaterialSampleGridControlsProps {
  storageUnit: StorageUnit;
}

export function useMaterialSampleGridControls({
  storageUnit
}: MaterialSampleGridControlsProps) {
  const { save } = useContext(ApiClientContext);

  const { compareByStringAndNumber } = useStringComparator();

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected PcrBatchItems.
  const [selectedItems, setSelectedItems] = useState<MaterialSample[]>([]);
  const lastSelectedItemRef = useRef<MaterialSample>();

  // Grid fill direction when you move multiple PcrBatchItems into the grid.
  const [fillMode, setFillMode] = useState<"COLUMN" | "ROW">("COLUMN");

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(SAMPLE_SELECTION_MATERIAL_SAMPLE_SORT_ORDER);

  const [gridState, setGridState] = useState({
    // Available Material Samples with no well coordinates.
    availableItems: [] as (MaterialSample & {
      sampleName?: string;
      sampleId?: string;
    })[],
    // The grid of Material Samples that have well coordinates.
    cellGrid: {} as CellGrid<
      MaterialSample & { sampleName?: string; sampleId?: string }
    >,
    // Material Samples that have been moved since data initialization.
    movedItems: [] as (MaterialSample & {
      sampleName?: string;
      sampleId?: string;
    })[]
  });

  // Boolean if the grid contains any of items.
  const gridIsPopulated = useMemo(
    () => !isEmpty(gridState.cellGrid),
    [gridState]
  );

  const { loading: materialSamplesQueryLoading, response } = useQuery<
    MaterialSample[]
  >(
    {
      path: "collection-api/material-sample",
      filter: {
        rsql: `storageUnitUsage.storageUnit.uuid==${storageUnit?.id}`
      },
      include: "storageUnitUsage",
      page: { limit: 1000 }
    },
    {
      onSuccess: async ({ data: materialSamples }) => {
        if (!materialSamples) return;

        const gridStateMaterialSamples: (MaterialSample & {
          sampleName?: string;
          sampleId?: string;
        })[] = materialSamples.map((materialSample) => ({
          ...materialSample,
          sampleId: materialSample.id,
          sampleName: materialSample?.materialSampleName ?? materialSample.id
        }));

        const gridStateMaterialSamplesWithCoords =
          gridStateMaterialSamples.filter(
            (item) =>
              item.storageUnitUsage?.wellRow &&
              item.storageUnitUsage?.wellColumn
          );

        const pcrBatchItemsNoCoords = gridStateMaterialSamples.filter(
          (item) =>
            !item.storageUnitUsage?.wellRow &&
            !item.storageUnitUsage?.wellColumn
        );

        const newCellGrid: CellGrid<
          MaterialSample & { sampleName?: string; sampleId?: string }
        > = {};
        gridStateMaterialSamplesWithCoords.forEach((item) => {
          newCellGrid[
            `${item.storageUnitUsage?.wellRow}_${item.storageUnitUsage?.wellColumn}`
          ] = item;
        });

        setGridState({
          availableItems: sortAvailableItems(pcrBatchItemsNoCoords),
          cellGrid: newCellGrid,
          movedItems: []
        });
      }
    }
  );

  useEffect(() => {
    async function getStorageUnitTypeLayout() {
      if (storageUnit.storageUnitType?.gridLayoutDefinition) {
        const gridLayoutDefinition =
          storageUnit.storageUnitType?.gridLayoutDefinition;
        setNumberOfColumns(gridLayoutDefinition.numberOfColumns);
        setNumberOfRows(gridLayoutDefinition.numberOfRows);
        setFillMode(
          gridLayoutDefinition.fillDirection === "BY_ROW" ? "ROW" : "COLUMN"
        );
        setIsStorage(true);
      }
    }
    getStorageUnitTypeLayout();
  }, []);

  function sortAvailableItems(
    batchItemSamples: (MaterialSample & {
      sampleName?: string;
      sampleId?: string;
    })[]
  ) {
    if (materialSampleSortOrder) {
      const sorted = materialSampleSortOrder.map((sampleId) =>
        batchItemSamples.find((item) => item.sampleId === sampleId)
      );
      batchItemSamples.forEach((item) => {
        if (
          materialSampleSortOrder.indexOf(item.sampleId ?? "unknown") === -1
        ) {
          sorted.push(item);
        }
      });
      return compact(sorted);
    } else {
      return compact(batchItemSamples);
    }
  }

  function moveItems(
    items: (MaterialSample & {
      sampleName?: string;
      sampleId?: string;
    })[],
    coords?: string
  ) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the PcrBatchItem from the grid.
      const newCellGrid: CellGrid<
        MaterialSample & {
          sampleName?: string;
          sampleId?: string;
        }
      > = omitBy(cellGrid, (item) => items.includes(item));

      // Remove the PcrBatchItem from the available PcrBatchItems.
      let newAvailableItems = availableItems.filter((s) => !items.includes(s));
      const newMovedItems = [...movedItems];

      if (coords) {
        const [rowLetter, colNumberString] = coords.split("_");
        const rowNumber = rowLetter.charCodeAt(0) - 64;

        // Double check this part
        let newCellNumber =
          fillMode === "ROW"
            ? (rowNumber - 1) * numberOfColumns + Number(colNumberString)
            : (Number(colNumberString) - 1) * numberOfRows + rowNumber;

        for (const item of items) {
          let thisItemRowNumber = -1;
          let thisItemColumnNumber = -1;

          if (fillMode === "ROW") {
            thisItemRowNumber = Math.ceil(newCellNumber / numberOfColumns);
            thisItemColumnNumber =
              newCellNumber % numberOfColumns || numberOfColumns;
          }
          if (fillMode === "COLUMN") {
            thisItemColumnNumber = Math.ceil(newCellNumber / numberOfRows);
            thisItemRowNumber = newCellNumber % numberOfRows || numberOfRows;
          }

          const thisItemCoords = `${String.fromCharCode(
            thisItemRowNumber + 64
          )}_${thisItemColumnNumber}`;

          // If there is already a PcrBatchItem in this cell, move the existing PcrBatchItem back to the list.
          const itemAlreadyInThisCell = newCellGrid[thisItemCoords];
          if (itemAlreadyInThisCell) {
            newAvailableItems.push(itemAlreadyInThisCell);
            if (!movedItems.includes(itemAlreadyInThisCell)) {
              newMovedItems.push(itemAlreadyInThisCell);
            }
          }

          // Only move the PcrBatchItem into the grid if the well is valid for this container type.
          if (newCellNumber <= numberOfColumns * numberOfRows) {
            // Move the PcrBatchItem into the grid.
            newCellGrid[thisItemCoords] = item;
          } else {
            newAvailableItems.push(item);
          }

          newCellNumber++;
        }
      } else {
        // Add the PcrBatchItem to the list.
        newAvailableItems = [...newAvailableItems, ...items];
      }

      // Set every PcrBatchItem passed into this function as moved.
      for (const item of items) {
        if (!movedItems.includes(item)) {
          newMovedItems.push(item);
        }
      }

      return {
        // availableItems: newAvailableItems.sort(itemSort),
        availableItems: newAvailableItems
          ?.filter((item) => item)
          .sort(itemSort),
        cellGrid: newCellGrid,
        movedItems: newMovedItems
      };
    });

    setSelectedItems([]);
  }

  function onGridDrop(
    item: MaterialSample & { sampleName?: string; sampleId?: string },
    coords: string
  ) {
    if (selectedItems.includes(item)) {
      moveItems(selectedItems, coords);
    } else {
      moveItems([item], coords);
    }
  }

  function onListDrop(item: {
    batchItemSample: MaterialSample & {
      sampleName?: string;
      sampleId?: string;
    };
  }) {
    moveItems([item.batchItemSample]);
  }

  function onItemClick(item, e) {
    const { availableItems } = gridState;

    if (lastSelectedItemRef.current && e.shiftKey) {
      const currentIndex = availableItems.indexOf(item);
      const lastIndex = availableItems.indexOf(lastSelectedItemRef.current);

      const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
        (a, b) => a - b
      );

      const newSelectedItems = availableItems.slice(lowIndex, highIndex + 1);

      setSelectedItems(newSelectedItems);
    } else {
      setSelectedItems([item]);
    }

    lastSelectedItemRef.current = item;
  }

  async function gridSubmit() {
    setSubmitting(true);
    try {
      const { cellGrid, movedItems } = gridState;

      const materialSampleItemsToSave = movedItems.map((movedItem) => {
        // Get the coords from the cell grid.
        const coords = Object.keys(cellGrid).find(
          (key) => cellGrid[key] === movedItem
        );

        let newWellColumn: number | undefined;
        let newWellRow: string | undefined;
        if (coords) {
          const [row, col] = coords.split("_");
          newWellColumn = Number(col);
          newWellRow = row;
        }
        if (movedItem.storageUnitUsage) {
          movedItem.storageUnitUsage.wellColumn = newWellColumn;
          movedItem.storageUnitUsage.wellRow = newWellRow;
        } else {
          movedItem.storageUnitUsage = {
            wellColumn: newWellColumn,
            wellRow: newWellRow,
            type: "storage-unit-usage"
          };
        }

        return movedItem;
      });
      // Save storageUnitUsage resources with valid wellColumn and wellRow
      const storageUnitUsageSaveArgs: SaveArgs<StorageUnitUsage>[] =
        materialSampleItemsToSave.map((item) => {
          return {
            type: "storage-unit-usage",
            resource: {
              wellColumn: item.storageUnitUsage?.wellColumn ?? null,
              wellRow: item.storageUnitUsage?.wellRow ?? null,
              storageUnit,
              type: "storage-unit-usage",
              id: item.storageUnitUsage?.id,
              usageType: "material-sample"
            }
          };
        });

      const savedStorageUnitUsage = storageUnitUsageSaveArgs.length
        ? await save<StorageUnitUsage>(storageUnitUsageSaveArgs, {
            apiBaseUrl: "/collection-api"
          })
        : [];
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
  }

  function itemSort(a, b) {
    const sampleName1 = a.sampleName;
    const sampleName2 = b.sampleName;
    return compareByStringAndNumber(sampleName1, sampleName2);
  }

  function clearGrid() {
    moveItems(Object.values(gridState.cellGrid));
  }

  async function moveAll() {
    // Do not perform the move if the grid contains anything.
    // Eventually we should be able to handle this case properly.
    if (gridIsPopulated) return;

    const { availableItems, cellGrid } = gridState;
    const items = [...availableItems, ...Object.values(cellGrid)].sort(
      itemSort
    );
    moveItems(items, "A_1");
  }

  const loading = materialSamplesQueryLoading || submitting;

  return {
    ...gridState,
    clearGrid,
    fillMode,
    gridSubmit,
    loading,
    moveAll,
    onGridDrop,
    onListDrop,
    onItemClick,
    selectedItems,
    setFillMode,
    isStorage,
    gridIsPopulated
  };
}
