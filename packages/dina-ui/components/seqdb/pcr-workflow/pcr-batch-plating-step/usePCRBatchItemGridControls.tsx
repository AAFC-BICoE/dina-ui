import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  DeleteArgs,
  filterBy,
  SaveArgs,
  useQuery,
  useStringComparator
} from "common-ui";
import { compact, isEmpty, omitBy, pick } from "lodash";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { CellGrid } from "../../container-grid/ContainerGrid";
import { StorageUnitCoordinates } from "packages/dina-ui/types/collection-api/resources/StorageUnitCoordinates";

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
  const { save, bulkGet } = useContext(ApiClientContext);

  const { compareByStringAndNumber } = useStringComparator();

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected PcrBatchItems.
  const [selectedItems, setSelectedItems] = useState<PcrBatchItemSample[]>([]);
  const lastSelectedItemRef = useRef<PcrBatchItemSample>();

  // Grid fill direction when you move multiple PcrBatchItems into the grid.
  const [fillMode, setFillMode] = useState<"COLUMN" | "ROW">("COLUMN");

  const [lastSave, setLastSave] = useState<number>();

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(`pcrWorkflowMaterialSampleSortOrder-${pcrBatchId}`);

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
    () => !isEmpty(gridState.cellGrid),
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
      include: "materialSample,storageUnitCoordinates"
    },
    {
      deps: [lastSave],
      onSuccess: async ({ data: pcrBatchItems }) => {
        if (!pcrBatchItems) return;

        /**
         * Fetch StorageUnitCoordinates linked to each PcrBatchItem
         * @returns
         */
        async function fetchStorageUnitCoordinates() {
          if (!pcrBatchItems) return;

          const storageUnitCoordinatesQuery =
            await bulkGet<StorageUnitCoordinates>(
              pcrBatchItems
                .filter((item) => item.storageUnitCoordinates?.id)
                .map(
                  (item) =>
                    "/storage-unit-coordinates/" +
                    item.storageUnitCoordinates?.id
                ),
              { apiBaseUrl: "/collection-api" }
            );

          const pcrBatchItemsWithStorageUnitCoordinates = pcrBatchItems.map(
            (pcrBatchItem) => {
              const queryStorageUnitCoordinates =
                storageUnitCoordinatesQuery.find(
                  (storageUnitCoordinate) =>
                    storageUnitCoordinate.id ===
                    pcrBatchItem.storageUnitCoordinates?.id
                );
              return {
                ...pcrBatchItem,
                wellColumn: queryStorageUnitCoordinates?.wellColumn,
                wellRow: queryStorageUnitCoordinates?.wellRow,
                storageUnitCoordinates: queryStorageUnitCoordinates
              };
            }
          );
          pcrBatchItems = pcrBatchItemsWithStorageUnitCoordinates;
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
              .map((item) => "/material-sample/" + item.materialSample?.id),
            { apiBaseUrl: "/collection-api" }
          ).then((response) => {
            const materialSamplesTransformed = compact(
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
        fetchStorageUnitCoordinates();
        fetchSamples((materialSamples) => {
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
              item.storageUnitCoordinates?.wellRow &&
              item.storageUnitCoordinates?.wellColumn
          );

          const pcrBatchItemsNoCoords = pcrBatchItemsWithSampleNames.filter(
            (item) =>
              !item.storageUnitCoordinates?.wellRow &&
              !item.storageUnitCoordinates?.wellColumn
          );

          const newCellGrid: CellGrid<PcrBatchItemSample> = {};
          pcrBatchItemsWithCoords.forEach((item) => {
            newCellGrid[
              `${item.storageUnitCoordinates?.wellRow}_${item.storageUnitCoordinates?.wellColumn}`
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
    if (!pcrBatch) return;

    if (pcrBatch?.storageRestriction) {
      setNumberOfColumns(pcrBatch.storageRestriction.layout.numberOfColumns);
      setNumberOfRows(pcrBatch.storageRestriction.layout.numberOfRows);
      setFillMode(
        pcrBatch.storageRestriction.layout.fillDirection === "BY_ROW"
          ? "ROW"
          : "COLUMN"
      );
      setIsStorage(true);
    }
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
      return compact(sorted);
    } else {
      return compact(batchItemSamples);
    }
  }

  function moveItems(items: PcrBatchItemSample[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the PcrBatchItem from the grid.
      const newCellGrid: CellGrid<PcrBatchItemSample> = omitBy(
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
        if (movedItem.storageUnitCoordinates) {
          movedItem.storageUnitCoordinates.wellColumn = newWellColumn;
          movedItem.storageUnitCoordinates.wellRow = newWellRow;
        } else {
          movedItem.storageUnitCoordinates = {
            wellColumn: newWellColumn,
            wellRow: newWellRow,
            type: "storage-unit-coordinates"
          };
        }

        return movedItem;
      });
      // Save storageUnitCoordinates resources with valid wellColumn and wellRow
      const storageUnitCoordinatesSaveArgs: SaveArgs<StorageUnitCoordinates>[] =
        materialSampleItemsToSave
          .filter(
            (item) =>
              item.storageUnitCoordinates?.wellColumn &&
              item.storageUnitCoordinates?.wellRow
          )
          .map((item) => ({
            type: "storage-unit-coordinates",
            resource: {
              wellColumn: item.storageUnitCoordinates?.wellColumn,
              wellRow: item.storageUnitCoordinates?.wellRow,
              storageUnit: pcrBatch.storageUnit,
              type: "storage-unit-coordinates",
              id: item.storageUnitCoordinates?.id
            }
          }));
      const savedStorageUnitCoordinates = storageUnitCoordinatesSaveArgs.length
        ? await save<StorageUnitCoordinates>(storageUnitCoordinatesSaveArgs, {
            apiBaseUrl: "/collection-api"
          })
        : [];

      const saveArgs: SaveArgs<PcrBatchItem>[] = materialSampleItemsToSave.map(
        (item) => {
          const matchedStorageunitCoordinates =
            savedStorageUnitCoordinates.find(
              (storageUnitCoordinate) =>
                storageUnitCoordinate.wellColumn ===
                  item.storageUnitCoordinates?.wellColumn &&
                storageUnitCoordinate.wellRow ===
                  item.storageUnitCoordinates?.wellRow
            );
          return {
            resource: {
              type: "pcr-batch-item",
              id: item.id,
              relationships: {
                storageUnitCoordinates: {
                  data: matchedStorageunitCoordinates
                    ? pick(matchedStorageunitCoordinates, "id", "type")
                    : null
                }
              }
            },
            type: "pcr-batch-item"
          };
        }
      );

      await save<PcrBatchItem>(saveArgs, { apiBaseUrl: "/seqdb-api" });

      // Delete storageUnitCoordinates resources without wellColumn or wellRow (presumably removed from grid)
      const deleteStorageUnitCoordinatesArgs: DeleteArgs[] =
        materialSampleItemsToSave
          .filter(
            (item) =>
              (!item.storageUnitCoordinates?.wellColumn ||
                !item.storageUnitCoordinates?.wellRow) &&
              item.storageUnitCoordinates?.id
          )
          .map((item) => ({
            delete: {
              id: item.storageUnitCoordinates?.id ?? "",
              type: "storage-unit-coordinates"
            }
          }));
      if (deleteStorageUnitCoordinatesArgs.length) {
        await save<StorageUnitCoordinates>(deleteStorageUnitCoordinatesArgs, {
          apiBaseUrl: "/collection-api"
        });
      }

      setLastSave(Date.now());
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
