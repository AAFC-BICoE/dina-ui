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
import {
  PcrBatchItem,
  SeqBatch,
  SeqReaction
} from "../../../../types/seqdb-api";
import { CellGrid } from "../../container-grid/ContainerGrid";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

interface SeqSelectCoordinatesControlsProps {
  seqBatchId: string;
  seqBatch: SeqBatch;
}

export interface SeqReactionSample {
  seqReactionId?: string;
  seqBatchId?: string;
  pcrBatchItemId?: string;
  storageUnitUsage?: StorageUnitUsage;
  primerId?: string;
  primerName?: string;
  primerDirection?: string;
  sampleId?: string;
  sampleName?: string;
}

export function useSeqSelectCoordinatesControls({
  seqBatchId,
  seqBatch
}: SeqSelectCoordinatesControlsProps) {
  const { save, bulkGet, apiClient } = useContext(ApiClientContext);

  const [itemsLoading, setItemsLoading] = useState<boolean>(true);

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected SeqBatchItems.
  const [selectedItems, setSelectedItems] = useState<SeqReactionSample[]>([]);
  const lastSelectedItemRef = useRef<SeqReactionSample>();

  // Grid fill direction when you move multiple SeqBatchItems into the grid.
  const [fillMode, setFillMode] = useState<"COLUMN" | "ROW">("COLUMN");

  const [lastSave, setLastSave] = useState<number>();

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [seqReactionSamples, setSeqReactionSamples] =
    useState<SeqReactionSample[]>();

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [seqReactionSortOrder] = useLocalStorage<string[]>(
    `seqReactionSortOrder-${seqBatch?.id}`
  );

  const [gridState, setGridState] = useState({
    // Available SeqBatchItems with no well coordinates.
    availableItems: [] as SeqReactionSample[],
    // The grid of SeqBatchItems that have well coordinates.
    cellGrid: {} as CellGrid<SeqReactionSample>,
    // SeqBatchItems that have been moved since data initialization.
    movedItems: [] as SeqReactionSample[]
  });

  // Boolean if the grid contains any of items.
  const gridIsPopulated = useMemo(
    () => !_.isEmpty(gridState.cellGrid),
    [gridState]
  );

  useEffect(() => {
    if (!seqBatch || !seqBatch.storageUnit) return;

    async function fetchStorageUnitTypeLayout() {
      const storageUnitReponse = await apiClient.get<StorageUnit>(
        `/collection-api/storage-unit/${seqBatch?.storageUnit?.id}`,
        { include: "storageUnitType" }
      );
      if (storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition) {
        const gridLayoutDefinition =
          storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition;
        _.set(
          seqBatch,
          "gridLayoutDefinition.numberOfColumns",
          gridLayoutDefinition.numberOfColumns
        );
        _.set(
          seqBatch,
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
  }, [seqBatch]);

  useEffect(() => {
    if (!seqReactionSamples) return;

    fetchSamples((materialSamples) => {
      const seqBatchItemsWithSampleNames =
        seqReactionSamples.map<SeqReactionSample>((reaction) => {
          const foundSample = materialSamples.find(
            (sample) => sample.id === reaction.sampleId
          );
          return {
            ...reaction,
            sampleId: foundSample?.id,
            sampleName: foundSample?.materialSampleName ?? foundSample?.id
          };
        });

      const seqBatchItemsWithCoords = seqBatchItemsWithSampleNames.filter(
        (item) =>
          item?.storageUnitUsage?.wellRow && item?.storageUnitUsage?.wellColumn
      );

      const seqBatchItemsNoCoords = seqBatchItemsWithSampleNames.filter(
        (item) =>
          !item?.storageUnitUsage?.wellRow &&
          !item?.storageUnitUsage?.wellColumn
      );

      const newCellGrid: CellGrid<SeqReactionSample> = {};
      seqBatchItemsWithCoords.forEach((item) => {
        newCellGrid[
          `${item?.storageUnitUsage?.wellRow}_${item.storageUnitUsage?.wellColumn}`
        ] = item;
      });

      setGridState({
        availableItems: sortAvailableItems(seqBatchItemsNoCoords), // seqBatchItemsNoCoords?.sort(itemSort),
        cellGrid: newCellGrid,
        movedItems: []
      });
      setItemsLoading(false);
    });
  }, [seqReactionSamples]);

  function sortAvailableItems(reactionSamples: SeqReactionSample[]) {
    if (seqReactionSortOrder) {
      const sorted = seqReactionSortOrder.map((reactionId) =>
        reactionSamples.find((item) => {
          const tempId: (string | undefined)[] = [];
          tempId.push(item.pcrBatchItemId);
          tempId.push(item.primerId);
          const id = _.compact(tempId).join("_");
          return id === reactionId;
        })
      );
      reactionSamples.forEach((item) => {
        const tempId: (string | undefined)[] = [];
        tempId.push(item.pcrBatchItemId);
        tempId.push(item.primerId);
        const id = _.compact(tempId).join("_");
        if (seqReactionSortOrder.indexOf(id) === -1) {
          sorted.push(item);
        }
      });
      return _.compact(sorted);
    } else {
      return _.compact(reactionSamples);
    }
  }

  /**
   * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
   * operation.
   */
  async function fetchSamples(callback: (response: MaterialSample[]) => void) {
    if (!seqReactionSamples) return;

    await bulkGet<MaterialSample>(
      seqReactionSamples
        .filter((item) => item.sampleId)
        .map((item) => "/material-sample-summary/" + item.sampleId),
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

  // SeqBatchItem queries.
  const { loading: materialSampleItemsLoading } = useQuery<SeqReaction[]>(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "seqBatch.uuid",
            comparison: "==",
            arguments: seqBatchId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `/seqdb-api/seq-reaction`,
      include: "pcrBatchItem,seqBatch,seqPrimer,storageUnitUsage"
    },
    {
      deps: [lastSave],
      onSuccess: async ({ data: seqReactions }) => {
        setItemsLoading(true);

        /**
         * Fetch StorageUnitUsage linked to each SeqReactions
         * @returns
         */
        async function fetchStorageUnitUsage(
          seqReactionSamp: SeqReactionSample[]
        ): Promise<SeqReactionSample[]> {
          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
            seqReactionSamp
              .filter((item) => item.storageUnitUsage?.id)
              .map(
                (item) => "/storage-unit-usage/" + item.storageUnitUsage?.id
              ),
            { apiBaseUrl: "/collection-api" }
          );

          return seqReactionSamp.map((seqReaction) => {
            const queryStorageUnitUsage = storageUnitUsageQuery.find(
              (storageUnitUsage) =>
                storageUnitUsage?.id === seqReaction.storageUnitUsage?.id
            );
            return {
              ...seqReaction,
              storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
            };
          });
        }

        const seqReactionAndPcrBatchItem = _.compact(
          seqReactions.map(
            (item) =>
              ({
                seqBatchId: item.seqBatch?.id,
                primerId: item.seqPrimer?.id,
                primerDirection: item.seqPrimer?.direction,
                primerName: item.seqPrimer?.name,
                seqReactionId: item.id,
                pcrBatchItemId: item.pcrBatchItem?.id,
                storageUnitUsage: item.storageUnitUsage
              } as SeqReactionSample)
          )
        );
        const seqReactionCompleted = await fetchStorageUnitUsage(
          seqReactionAndPcrBatchItem
        );

        const pcrBatchItems = _.compact(
          await bulkGet<PcrBatchItem, true>(
            seqReactionCompleted?.map(
              (item) =>
                `/pcr-batch-item/${item.pcrBatchItemId}?include=materialSample`
            ),
            {
              apiBaseUrl: "/seqdb-api",
              returnNullForMissingResource: true
            }
          )
        );

        setSeqReactionSamples(
          seqReactionCompleted.map((rec) => {
            const pcrBatchItem = pcrBatchItems.find(
              (item) => item.id === rec.pcrBatchItemId
            );
            return {
              ...rec,
              pcrBatchItemId: pcrBatchItem?.id,
              sampleId: pcrBatchItem?.materialSample?.id
            };
          })
        );
      }
    }
  );

  function moveItems(items: SeqReactionSample[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the SeqBatchItem from the grid.
      const newCellGrid: CellGrid<SeqReactionSample> = _.omitBy(
        cellGrid,
        (item) => items.includes(item)
      );

      // Remove the SeqBatchItem from the available SeqBatchItems.
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

          // If there is already a SeqBatchItem in this cell, move the existing SeqBatchItem back to the list.
          const itemAlreadyInThisCell = newCellGrid[thisItemCoords];
          if (itemAlreadyInThisCell) {
            newAvailableItems.push(itemAlreadyInThisCell);
            if (!movedItems.includes(itemAlreadyInThisCell)) {
              newMovedItems.push(itemAlreadyInThisCell);
            }
          }

          // Only move the SeqBatchItem into the grid if the well is valid for this container type.
          if (newCellNumber <= numberOfColumns * numberOfRows) {
            // Move the SeqBatchItem into the grid.
            newCellGrid[thisItemCoords] = item;
          } else {
            newAvailableItems.push(item);
          }

          newCellNumber++;
        }
      } else {
        // Add the SeqBatchItem to the list.
        newAvailableItems = [...newAvailableItems, ...items];
      }

      // Set every SeqBatchItem passed into this function as moved.
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

  function onGridDrop(item: SeqReactionSample, coords: string) {
    if (selectedItems.includes(item)) {
      moveItems(selectedItems, coords);
    } else {
      moveItems([item], coords);
    }
  }

  function onListDrop(item: { batchItemSample: SeqReactionSample }) {
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
              storageUnit: seqBatch.storageUnit,
              type: "storage-unit-usage",
              id: item.storageUnitUsage?.id,
              usageType: "seq-reaction"
            }
          }));

      // Perform create/update for storage unit usages if required.
      const savedStorageUnitUsages = storageUnitUsageSaveArgs.length
        ? await save<StorageUnitUsage>(storageUnitUsageSaveArgs, {
            apiBaseUrl: "/collection-api"
          })
        : [];

      const saveArgs = materialSampleItemsToSave.map((item) => {
        const matchedStorageUnitUsage = savedStorageUnitUsages.find(
          (storageUsage) =>
            storageUsage.wellColumn === item.storageUnitUsage?.wellColumn &&
            storageUsage.wellRow === item.storageUnitUsage?.wellRow
        );

        return {
          resource: {
            type: "seq-reaction",
            id: item.seqReactionId,
            relationships: {
              seqBatch: {
                data: {
                  id: item.seqBatchId,
                  type: "seq-batch"
                }
              },
              pcrBatchItem: {
                data: {
                  id: item.pcrBatchItemId,
                  type: "pcr-batch-item"
                }
              },
              seqPrimer: {
                data: {
                  id: item.primerId,
                  type: "pcr-primer"
                }
              },
              storageUnitUsage: {
                data: matchedStorageUnitUsage
                  ? _.pick(matchedStorageUnitUsage, "id", "type")
                  : null
              }
            }
          },
          type: "seq-reaction"
        };
      });

      await save(saveArgs, { apiBaseUrl: "/seqdb-api" });

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
