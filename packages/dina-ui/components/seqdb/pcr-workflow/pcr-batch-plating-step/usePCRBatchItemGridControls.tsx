import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  DeleteArgs,
  filterBy,
  SaveArgs,
  useQuery,
  useStringComparator
} from "common-ui";
import _ from "lodash";
import {
  MaterialSample,
  StorageUnit
} from "packages/dina-ui/types/collection-api";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { CellGrid } from "../../container-grid/ContainerGrid";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

interface ContainerGridProps {
  pcrBatchId: string;
  pcrBatch: PcrBatch;
}

export interface PcrBatchItemSample extends PcrBatchItem {
  sampleName?: string;
}

export function usePCRBatchItemGridControls({
  pcrBatchId,
  pcrBatch
}: ContainerGridProps) {
  const { save, bulkGet, apiClient } = useContext(ApiClientContext);

  const { compareByStringAndNumber } = useStringComparator();

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected PcrBatchItems.
  const [selectedItems, setSelectedItems] = useState<PcrBatchItemSample[]>([]);
  const lastSelectedItemRef = useRef<PcrBatchItemSample>();

  // Grid fill direction when you move multiple PcrBatchItems into the grid.
  const [fillMode, setFillMode] = useState<"COLUMN" | "ROW">("COLUMN");

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [materialSampleSortOrder] = useLocalStorage<string[]>(
    `pcrWorkflowMaterialSampleSortOrder-${pcrBatchId}`
  );

  const [gridState, setGridState] = useState({
    // Available PcrBatchItems with no well coordinates.
    availableItems: [] as PcrBatchItemSample[],
    // The grid of PcrBatchItems that have well coordinates.
    cellGrid: {} as CellGrid<PcrBatchItemSample>,
    // PcrBatchItems that have been moved since data initialization.
    movedItems: [] as PcrBatchItemSample[]
  });
  const [loadingRelationships, setLoadingRelationships] =
    useState<boolean>(false);

  // Boolean if the grid contains any of items.
  const gridIsPopulated = useMemo(
    () => !_.isEmpty(gridState.cellGrid),
    [gridState]
  );

  // PcrBatchItem queries.
  const { loading: materialSampleItemsLoading } = useQuery<PcrBatchItem[]>(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "pcrBatch.uuid",
            comparison: "==",
            arguments: pcrBatchId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `/seqdb-api/pcr-batch-item`,
      include: "materialSample,storageUnitUsage"
    },
    {
      onSuccess: async ({ data: pcrBatchItems }) => {
        if (!pcrBatchItems) return;

        /**
         * Fetch StorageUnitUsage linked to each PcrBatchItem
         * @returns
         */
        async function fetchStorageUnitUsage() {
          if (!pcrBatchItems) return;

          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
            pcrBatchItems
              .filter((item) => item.storageUnitUsage?.id)
              .map(
                (item) => "/storage-unit-usage/" + item.storageUnitUsage?.id
              ),
            { apiBaseUrl: "/collection-api" }
          );
          const pcrBatchItemsWithStorageUnitUsage = pcrBatchItems.map(
            (pcrBatchItem) => {
              const queryStorageUnitUsage = storageUnitUsageQuery.find(
                (storageUnitUsage) =>
                  storageUnitUsage?.id === pcrBatchItem.storageUnitUsage?.id
              );
              return {
                ...pcrBatchItem,
                wellColumn: queryStorageUnitUsage?.wellColumn,
                wellRow: queryStorageUnitUsage?.wellRow,
                storageUnitUsage: queryStorageUnitUsage
              };
            }
          );
          pcrBatchItems = pcrBatchItemsWithStorageUnitUsage;
        }

        /**
         * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
         * operation.
         */
        async function fetchSamples(
          callback: (response: MaterialSample[]) => void
        ) {
          if (!pcrBatchItems) return;

          await bulkGet<MaterialSample>(
            pcrBatchItems
              .filter((item) => item.materialSample?.id)
              .map(
                (item) => "/material-sample-summary/" + item.materialSample?.id
              ),
            { apiBaseUrl: "/collection-api" }
          ).then((response) => {
            const materialSamplesTransformed = _.compact(
              response
            ).map<MaterialSample>((resource) => ({
              materialSampleName: resource.materialSampleName,
              id: resource.id,
              type: resource.type
            }));

            callback(materialSamplesTransformed);
          });
        }

        setLoadingRelationships(true);
        await fetchStorageUnitUsage();
        await fetchSamples((materialSamples) => {
          const pcrBatchItemsWithSampleNames =
            materialSamples.map<PcrBatchItemSample>((sample) => {
              const batchItem = pcrBatchItems.find(
                (item) => item.materialSample?.id === sample.id
              );
              return {
                ...batchItem,
                type: "pcr-batch-item",
                sampleId: sample.id,
                sampleName: sample?.materialSampleName ?? sample.id
              };
            });

          const pcrBatchItemsWithCoords = pcrBatchItemsWithSampleNames.filter(
            (item) =>
              item.storageUnitUsage?.wellRow &&
              item.storageUnitUsage?.wellColumn
          );

          const pcrBatchItemsNoCoords = pcrBatchItemsWithSampleNames.filter(
            (item) =>
              !item.storageUnitUsage?.wellRow &&
              !item.storageUnitUsage?.wellColumn
          );

          const newCellGrid: CellGrid<PcrBatchItemSample> = {};
          pcrBatchItemsWithCoords.forEach((item) => {
            newCellGrid[
              `${item.storageUnitUsage?.wellRow}_${item.storageUnitUsage?.wellColumn}`
            ] = item;
          });

          setGridState({
            availableItems: sortAvailableItems(pcrBatchItemsNoCoords),
            cellGrid: newCellGrid,
            movedItems: []
          });
        });
        setLoadingRelationships(false);
      }
    }
  );

  useEffect(() => {
    if (!pcrBatch || !pcrBatch.storageUnit) return;

    async function fetchStorageUnitTypeLayout() {
      const storageUnitReponse = await apiClient.get<StorageUnit>(
        `/collection-api/storage-unit/${pcrBatch?.storageUnit?.id}`,
        { include: "storageUnitType" }
      );
      if (storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition) {
        const gridLayoutDefinition =
          storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition;
        _.set(
          pcrBatch,
          "gridLayoutDefinition.numberOfColumns",
          gridLayoutDefinition.numberOfColumns
        );
        _.set(
          pcrBatch,
          "gridLayoutDefinition.numberOfRows",
          gridLayoutDefinition.numberOfRows
        );
        setNumberOfColumns(gridLayoutDefinition.numberOfColumns);
        setNumberOfRows(gridLayoutDefinition.numberOfRows);
        setFillMode(
          gridLayoutDefinition.fillDirection === "BY_ROW" ? "ROW" : "COLUMN"
        );
        setIsStorage(true);
      }
    }
    fetchStorageUnitTypeLayout();
  }, [pcrBatch]);

  function sortAvailableItems(batchItemSamples: PcrBatchItemSample[]) {
    if (materialSampleSortOrder) {
      const sorted = materialSampleSortOrder.map((sampleId) =>
        batchItemSamples.find((item) => item.materialSample?.id === sampleId)
      );
      batchItemSamples.forEach((item) => {
        if (
          materialSampleSortOrder.indexOf(
            item.materialSample?.id ?? "unknown"
          ) === -1
        ) {
          sorted.push(item);
        }
      });
      return _.compact(sorted);
    } else {
      return _.compact(batchItemSamples);
    }
  }

  function moveItems(items: PcrBatchItemSample[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the PcrBatchItem from the grid.
      const newCellGrid: CellGrid<PcrBatchItemSample> = _.omitBy(
        cellGrid,
        (item) => items.includes(item)
      );

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

  function onGridDrop(item: PcrBatchItemSample, coords: string) {
    if (selectedItems.includes(item)) {
      moveItems(selectedItems, coords);
    } else {
      moveItems([item], coords);
    }
  }

  function onListDrop(item: { batchItemSample: PcrBatchItemSample }) {
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
        materialSampleItemsToSave
          .filter(
            (item) =>
              item.storageUnitUsage?.wellColumn &&
              item.storageUnitUsage?.wellRow
          )
          .map((item) => ({
            type: "storage-unit-usage",
            resource: {
              wellColumn: item.storageUnitUsage?.wellColumn,
              wellRow: item.storageUnitUsage?.wellRow,
              storageUnit: pcrBatch.storageUnit,
              type: "storage-unit-usage",
              id: item.storageUnitUsage?.id,
              usageType: "pcr-batch-item"
            }
          }));
      const savedStorageUnitUsage = storageUnitUsageSaveArgs.length
        ? await save<StorageUnitUsage>(storageUnitUsageSaveArgs, {
            apiBaseUrl: "/collection-api"
          })
        : [];

      const saveArgs: SaveArgs<PcrBatchItem>[] = materialSampleItemsToSave.map(
        (item) => {
          const matchedStorageUnitUsage = savedStorageUnitUsage.find(
            (storageUnitUsage) =>
              storageUnitUsage.wellColumn ===
                item.storageUnitUsage?.wellColumn &&
              storageUnitUsage.wellRow === item.storageUnitUsage?.wellRow
          );
          return {
            resource: {
              type: "pcr-batch-item",
              id: item.id,
              relationships: {
                storageUnitUsage: {
                  data: matchedStorageUnitUsage
                    ? _.pick(matchedStorageUnitUsage, "id", "type")
                    : null
                }
              }
            },
            type: "pcr-batch-item"
          };
        }
      );

      await save<PcrBatchItem>(saveArgs, { apiBaseUrl: "/seqdb-api" });

      // Delete storageUnitUsage resources without wellColumn or wellRow (presumably removed from grid)
      const deleteStorageUnitUsageArgs: DeleteArgs[] = materialSampleItemsToSave
        .filter(
          (item) =>
            (!item.storageUnitUsage?.wellColumn ||
              !item.storageUnitUsage?.wellRow) &&
            item.storageUnitUsage?.id
        )
        .map((item) => ({
          delete: {
            id: item.storageUnitUsage?.id ?? "",
            type: "storage-unit-usage"
          }
        }));
      if (deleteStorageUnitUsageArgs.length) {
        await save<StorageUnitUsage>(deleteStorageUnitUsageArgs, {
          apiBaseUrl: "/collection-api"
        });
      }
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

  const loading =
    materialSampleItemsLoading || submitting || loadingRelationships;

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
