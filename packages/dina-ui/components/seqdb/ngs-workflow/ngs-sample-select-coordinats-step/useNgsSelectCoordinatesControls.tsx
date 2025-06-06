import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  DeleteArgs,
  filterBy,
  SaveArgs,
  useQuery
} from "common-ui";
import _ from "lodash";
import {
  MaterialSample,
  StorageUnit
} from "packages/dina-ui/types/collection-api";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { LibraryPrep, LibraryPrepBatch } from "../../../../types/seqdb-api";
import { CellGrid } from "../../container-grid/ContainerGrid";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

interface NsgSelectCoordinatesControlsProps {
  libraryPrepBatchId: string;
  libraryPrepBatch: LibraryPrepBatch;
}

export interface NsgSample {
  libraryPrepId?: string;
  libraryPrep?: LibraryPrep;
  libraryPrepBatchId?: string;
  libraryPrepBatch?: LibraryPrepBatch;
  storageUnitUsage?: StorageUnitUsage;
  sampleId?: string;
  sampleName?: string;
}

export function useNsgSelectCoordinatesControls({
  libraryPrepBatchId,
  libraryPrepBatch
}: NsgSelectCoordinatesControlsProps) {
  const { save, bulkGet, apiClient } = useContext(ApiClientContext);

  const [itemsLoading, setItemsLoading] = useState<boolean>(true);

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected library prep items.
  const [selectedItems, setSelectedItems] = useState<NsgSample[]>([]);
  const lastSelectedItemRef = useRef<NsgSample>();

  // Grid fill direction when you move multiple library prep items into the grid.
  const [fillMode, setFillMode] = useState<"COLUMN" | "ROW">("COLUMN");

  const [lastSave, setLastSave] = useState<number>();

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [ngsSamples, setNgsSamples] = useState<NsgSample[]>();

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [ngsSamplesSortOrder] = useLocalStorage<string[]>(
    `ngsMaterialSampleSortOrder-${libraryPrepBatch?.id}`
  );

  const [gridState, setGridState] = useState({
    // Available NsgSample with no well coordinates.
    availableItems: [] as NsgSample[],
    // The grid of NsgSample that have well coordinates.
    cellGrid: {} as CellGrid<NsgSample>,
    // NsgSample that have been moved since data initialization.
    movedItems: [] as NsgSample[]
  });

  // Boolean if the grid contains any of items.
  const gridIsPopulated = useMemo(
    () => !_.isEmpty(gridState.cellGrid),
    [gridState]
  );

  useEffect(() => {
    if (!libraryPrepBatch || !libraryPrepBatch.storageUnit) return;

    async function fetchStorageUnitTypeLayout() {
      const storageUnitReponse = await apiClient.get<StorageUnit>(
        `/collection-api/storage-unit/${libraryPrepBatch?.storageUnit?.id}`,
        { include: "storageUnitType" }
      );
      if (storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition) {
        const gridLayoutDefinition =
          storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition;
        _.set(
          libraryPrepBatch,
          "gridLayoutDefinition.numberOfColumns",
          gridLayoutDefinition.numberOfColumns
        );
        _.set(
          libraryPrepBatch,
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
  }, [libraryPrepBatch]);

  useEffect(() => {
    if (!ngsSamples) return;

    fetchSamples((materialSamples) => {
      const libraryPrepItemsWithSampleNames = ngsSamples.map<NsgSample>(
        (ngsSample) => {
          const foundSample = materialSamples.find(
            (sample) => sample.id === ngsSample.sampleId
          );
          return {
            ...ngsSample,
            sampleId: foundSample?.id,
            sampleName: foundSample?.materialSampleName ?? foundSample?.id
          };
        }
      );

      const libraryPrepItemsWithCoords = libraryPrepItemsWithSampleNames.filter(
        (item) =>
          item?.storageUnitUsage?.wellRow && item?.storageUnitUsage?.wellColumn
      );

      const libraryPrepItemsNoCoords = libraryPrepItemsWithSampleNames.filter(
        (item) =>
          !item?.storageUnitUsage?.wellRow &&
          !item?.storageUnitUsage?.wellColumn
      );

      const newCellGrid: CellGrid<NsgSample> = {};
      libraryPrepItemsWithCoords.forEach((item) => {
        newCellGrid[
          `${item?.storageUnitUsage?.wellRow}_${item.storageUnitUsage?.wellColumn}`
        ] = item;
      });

      setGridState({
        availableItems: sortAvailableItems(libraryPrepItemsNoCoords),
        cellGrid: newCellGrid,
        movedItems: []
      });
      setItemsLoading(false);
    });
  }, [ngsSamples]);

  function sortAvailableItems(ngsSampleArray: NsgSample[]) {
    if (ngsSamplesSortOrder) {
      const sorted = ngsSamplesSortOrder.map((reactionId) =>
        ngsSampleArray.find((item) => {
          const tempId: (string | undefined)[] = [];
          tempId.push(item.sampleId);
          const id = _.compact(tempId).join("_");
          return id === reactionId;
        })
      );
      ngsSampleArray.forEach((item) => {
        const tempId: (string | undefined)[] = [];
        tempId.push(item.sampleId);
        const id = _.compact(tempId).join("_");
        if (ngsSamplesSortOrder.indexOf(id) === -1) {
          sorted.push(item);
        }
      });
      return _.compact(sorted);
    } else {
      return _.compact(ngsSampleArray);
    }
  }

  /**
   * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
   * operation.
   */
  async function fetchSamples(callback: (response: MaterialSample[]) => void) {
    if (!ngsSamples) return;

    await bulkGet<MaterialSample>(
      ngsSamples
        .filter((item) => item.sampleId)
        .map((item) => "/material-sample/" + item.sampleId),
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

  // LibraryPrep queries.
  const { loading: materialSampleItemsLoading } = useQuery<LibraryPrep[]>(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "libraryPrepBatch.uuid",
            comparison: "==",
            arguments: libraryPrepBatchId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `/seqdb-api/library-prep`,
      include: "storageUnitUsage"
    },
    {
      deps: [lastSave],
      onSuccess: async ({ data: libraryPreps }) => {
        setItemsLoading(true);

        /**
         * Fetch Storage Unit Usage linked to each Library Prep
         * @returns
         */
        async function fetchStorageUnitUsage(
          ngsSamplesArray: NsgSample[]
        ): Promise<NsgSample[]> {
          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
            ngsSamplesArray
              .filter((item) => item.storageUnitUsage?.id)
              .map(
                (item) => "/storage-unit-usage/" + item.storageUnitUsage?.id
              ),
            { apiBaseUrl: "/collection-api" }
          );

          return ngsSamplesArray.map((ngsSample) => {
            const queryStorageUnitUsage = storageUnitUsageQuery.find(
              (storageUnitUsage) =>
                storageUnitUsage?.id === ngsSample.storageUnitUsage?.id
            );
            return {
              ...ngsSample,
              storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
            };
          });
        }

        const libraryPrepsAndLibraryPrepBatch = _.compact(
          libraryPreps.map(
            (item) =>
              ({
                storageUnitUsage: item.storageUnitUsage,
                libraryPrep: item,
                libraryPrepBatch,
                libraryPrepBatchId,
                libraryPrepId: item.id
              } as NsgSample)
          )
        );
        const ngsSamplesCompleted = await fetchStorageUnitUsage(
          libraryPrepsAndLibraryPrepBatch
        );

        const libraryPrepItems = _.compact(
          await bulkGet<LibraryPrep, true>(
            ngsSamplesCompleted?.map(
              (item) =>
                `/library-prep/${item.libraryPrepId}?include=materialSample`
            ),
            {
              apiBaseUrl: "/seqdb-api",
              returnNullForMissingResource: true
            }
          )
        );

        setNgsSamples(
          ngsSamplesCompleted.map((rec) => {
            const libraryPrep = libraryPrepItems.find(
              (item) => item.id === rec.libraryPrepId
            );
            return {
              ...rec,
              sampleId: libraryPrep?.materialSample?.id
            };
          })
        );
      }
    }
  );

  function moveItems(items: NsgSample[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the NsgSample from the grid.
      const newCellGrid: CellGrid<NsgSample> = _.omitBy(cellGrid, (item) =>
        items.includes(item)
      );

      // Remove the NsgSample from the available NsgSample.
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

          // If there is already a NsgSample in this cell, move the existing NsgSample back to the list.
          const itemAlreadyInThisCell = newCellGrid[thisItemCoords];
          if (itemAlreadyInThisCell) {
            newAvailableItems.push(itemAlreadyInThisCell);
            if (!movedItems.includes(itemAlreadyInThisCell)) {
              newMovedItems.push(itemAlreadyInThisCell);
            }
          }

          // Only move the NsgSample into the grid if the well is valid for this container type.
          if (newCellNumber <= numberOfColumns * numberOfRows) {
            // Move the NsgSample into the grid.
            newCellGrid[thisItemCoords] = item;
          } else {
            newAvailableItems.push(item);
          }

          newCellNumber++;
        }
      } else {
        // Add the NsgSample to the list.
        newAvailableItems = [...newAvailableItems, ...items];
      }

      // Set every NsgSample passed into this function as moved.
      for (const item of items) {
        if (!movedItems.includes(item)) {
          newMovedItems.push(item);
        }
      }

      return {
        // availableItems: newAvailableItems.sort(itemSort),
        availableItems: sortAvailableItems(newAvailableItems), // newAvailableItems?.filter((item) => item).sort(itemSort),
        cellGrid: newCellGrid,
        movedItems: newMovedItems
      };
    });

    setSelectedItems([]);
  }

  function onGridDrop(item: NsgSample, coords: string) {
    if (selectedItems.includes(item)) {
      moveItems(selectedItems, coords);
    } else {
      moveItems([item], coords);
    }
  }

  function onListDrop(item: { batchItemSample: NsgSample }) {
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

      const libraryPrepsToSave = movedItems.map((movedItem) => {
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
        libraryPrepsToSave
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
              storageUnit: libraryPrepBatch.storageUnit,
              type: "storage-unit-usage",
              id: item.storageUnitUsage?.id,
              usageType: "library-prep"
            }
          }));

      // Perform create/update for storage unit usages if required.
      const savedStorageUnitUsages = storageUnitUsageSaveArgs.length
        ? await save<StorageUnitUsage>(storageUnitUsageSaveArgs, {
            apiBaseUrl: "/collection-api"
          })
        : [];

      const saveArgs = libraryPrepsToSave.map((item) => {
        const matchedStorageUnitUsage = savedStorageUnitUsages.find(
          (storageUsage) =>
            storageUsage.wellColumn === item.storageUnitUsage?.wellColumn &&
            storageUsage.wellRow === item.storageUnitUsage?.wellRow
        );

        return {
          resource: {
            type: "library-prep",
            id: item.libraryPrepId,
            relationships: {
              libraryPrepBatch: {
                data: {
                  id: item.libraryPrepBatchId,
                  type: "library-prep-batch"
                }
              },
              materialSample: {
                data: {
                  id: item.sampleId,
                  type: "material-sample"
                }
              },
              storageUnitUsage: {
                data: matchedStorageUnitUsage
                  ? _.pick(matchedStorageUnitUsage, "id", "type")
                  : null
              }
            }
          },
          type: "library-prep"
        };
      });

      await save(saveArgs, { apiBaseUrl: "/seqdb-api" });

      // Delete storageUnitUsage resources without wellColumn or wellRow (presumably removed from grid)
      const deleteStorageUnitUsageArgs: DeleteArgs[] = libraryPrepsToSave
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

      setLastSave(Date.now());
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
  }

  function clearGrid() {
    moveItems(Object.values(gridState.cellGrid));
  }

  async function moveAll() {
    // Do not perform the move if the grid contains anything.
    // Eventually we should be able to handle this case properly.
    if (gridIsPopulated) return;

    const { availableItems, cellGrid } = gridState;
    const items = [...availableItems, ...Object.values(cellGrid)];
    moveItems(items, "A_1");
  }

  const loading = materialSampleItemsLoading || itemsLoading || submitting;

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
