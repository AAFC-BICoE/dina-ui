import { ApiClientContext, filterBy, useQuery } from "common-ui";
import { omitBy } from "lodash";
import { useContext, useRef, useState } from "react";
import { PcrBatchItem } from "../../../../types/seqdb-api";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { CellGrid } from "./ContainerGrid";

interface ContainerGridProps {
  pcrBatchId: string;
}

export function UsePCRBatchItemGridControls({
  pcrBatchId
}: ContainerGridProps) {
  const { apiClient, save } = useContext(ApiClientContext);

  const [itemsLoading, setItemsLoading] = useState<boolean>(true);

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected samples.
  const [selectedItems, setSelectedItems] = useState<PcrBatchItem[]>([]);
  const lastSelectedItemRef = useRef<PcrBatchItem>();

  // Grid fill direction when you move multiple samples into the grid.
  const [fillMode, setFillMode] = useState<string>("COLUMN");

  const [lastSave, setLastSave] = useState<number>();

  const [gridState, setGridState] = useState({
    // Available samples with no well coordinates.
    availableItems: [] as PcrBatchItem[],
    // The grid of samples that have well coordinates.
    cellGrid: {} as CellGrid,
    // Samples that have been moved since data initialization.
    movedItems: [] as PcrBatchItem[]
  });

  // Library prep and sample queries.
  const { loading: pcrBatchItemsLoading, response: pcrBatchItemsResponse } =
    useQuery<PcrBatchItem[]>(
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
        path: `/seqdb-api/pcr-batch-item`
      },
      {
        deps: [lastSave],
        onSuccess: async ({ data: pcrBatchItems }) => {
          setItemsLoading(true);

          const pcrBatchItemsWithCoords = pcrBatchItems.filter(
            item => item.wellRow && item.wellColumn
          );

          const newCellGrid: CellGrid = {};
          for (const {
            wellRow,
            wellColumn
          } of pcrBatchItemsWithCoords) {
            newCellGrid[`${wellRow}_${wellColumn}`] = pcrBatchItem;
          }

          const pcrBatchItemIdsWithCoords = pcrBatchItemsWithCoords
            .map(item => item.id)
            .join();

          const { data: pcrBatchItemsNoCoords } = await apiClient.get<PcrBatchItem[]>
          ("/seqdb-api/pcr-batch-item", {
            // Get all the PcrBatchItems that have no coords.
            filter: {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatchId,
              rsql: `pcrBatchItems.uuid=out=(${
                pcrBatchItemIdsWithCoords || "00000000-0000-0000-0000-000000000000"
              })`
            },
            page: { limit: 1000 }
          });

          // const newAvailablepcrItems = pcrBatchItemsNoCoords
          //   .map(sr => sr.mole)
          //   .sort(itemSort);

          setGridState({
            availableItems: pcrBatchItemsNoCoords,
            cellGrid: newCellGrid,
            movedItems: []
          });
          setItemsLoading(false);
        }
      }
    );

  function moveItems(items: PcrBatchItem[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the sample from the grid.
      const newCellGrid: CellGrid = omitBy(cellGrid, s => items.includes(s));

      // Remove the sample from the availables samples.
      let newAvailableItems = availableItems.filter(
        s => !items.includes(s)
      );
      const newMovedItems = [...movedItems];

      if (coords) {
        const [rowLetter, colNumberString] = coords.split("_");
        const rowNumber = rowLetter.charCodeAt(0) - 64;
        const { wellColumn, wellRow } = pcrBatchItem as PcrBatchItem;

        if(wellColumn !== undefined && wellRow !== undefined){
        //double check this part
        let newCellNumber =
          fillMode === "ROW"
            ? (rowNumber - 1) * Number(wellColumn) + Number(colNumberString)
            : (Number(colNumberString) - 1) * Number(wellRow) + rowNumber;

        for (const item of items) {
          let thisItemRowNumber = -1;
          let thisItemColumnNumber = -1;

          if (fillMode === "ROW") {
            thisItemRowNumber = Math.ceil(newCellNumber / wellColumn);
            thisItemColumnNumber =
              newCellNumber % wellColumn || wellColumn;
          }
          if (fillMode === "COLUMN") {
            thisItemColumnNumber = Math.ceil(newCellNumber / Number(wellRow));
            thisItemRowNumber = newCellNumber % Number(wellRow) || Number(wellRow);
          }

          const thisItemCoords = `${String.fromCharCode(
            thisItemRowNumber + 64
          )}_${thisItemColumnNumber}`;

          // If there is already a sample in this cell, move the existing sample back to the list.
          const itemAlreadyInThisCell = newCellGrid[thisItemCoords];
          if (itemAlreadyInThisCell) {
            newAvailableItems.push(itemAlreadyInThisCell);
            if (!movedItems.includes(itemAlreadyInThisCell)) {
              newMovedItems.push(itemAlreadyInThisCell);
            }
          }

          // Only move the sample into the grid if the well is valid for this container type.
          if (newCellNumber <= wellColumn * Number(wellRow)) {
            // Move the sample into the grid.
            newCellGrid[thisItemCoords] = item;
          } else {
            newAvailableItems.push(item);
          }

          newCellNumber++;
        }
      } else {
        // Add the sample to the list.
        newAvailableItems = [...newAvailableItems, ...items];
      }
    }

      // Set every sample passed into this function as moved.
      for (const item of items) {
        if (!movedItems.includes(item)) {
          newMovedItems.push(item);
        }
      }

      return {
        availableItems: newAvailableItems.sort(itemSort),
        cellGrid: newCellGrid,
        movedItems: newMovedItems
      };
    });

    setSelectedItems([]);
  }

  function onGridDrop(item: PcrBatchItem, coords: string) {
    if (selectedItems.includes(item)) {
      moveItems(selectedItems, coords);
    } else {
      moveItems([item], coords);
    }
  }

  function onListDrop(item: PcrBatchItem) {
    moveItems([item]);
  }

  function onItemClick(item, e) {
    const { availableItems } = gridState;

    if (lastSelectedItemRef.current && e.shiftKey) {
      const currentIndex = availableItems.indexOf(item);
      const lastIndex = availableItems.indexOf(lastSelectedItemRef.current);

      const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
        (a, b) => a - b
      );

      const newSelectedItems = availableItems.slice(
        lowIndex,
        highIndex + 1
      );

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

      const existingPcrBatchItems = pcrBatchItemsResponse
        ? pcrBatchItemsResponse.data
        : [];

      const pcrBatchItemsToSave = movedItems.map(movedItem => {
        // Get the coords from the cell grid.
        const coords = Object.keys(cellGrid).find(
          key => cellGrid[key] === movedItem
        );

        const existingPcrBatchItem = existingPcrBatchItems.find(
          item => item.id === movedItem.id
        );

        let newWellColumn: number | undefined;
        let newWellRow: string | undefined;
        if (coords) {
          const [row , col] = coords.split("_");
          newWellColumn = Number(col);
          newWellRow = row;
        }

        existingPcrBatchItem.wellColumn = newWellColumn;
        existingPcrBatchItem.wellRow = newWellRow;

        return existingPcrBatchItem;
      });

      const saveArgs = pcrBatchItemsToSave.map(item => ({
        resource: item,
        type: "pcr-batch-item"
      }));

      await save(saveArgs, { apiBaseUrl: "/seqdb-api" });

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
    const { availableItems, cellGrid } = gridState;
    const items = [...availableItems, ...Object.values(cellGrid)].sort(
      itemSort
    );
    moveItems(items, "A_1");
  }

  const loading = pcrBatchItemsLoading || itemsLoading || submitting;

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
    setFillMode
  };
}

function itemSort(a, b) {
  const [[aAlpha, aNum], [bAlpha, bNum]] = [a, b].map(
    s => s.name.match(/[^\d]+|\d+/g) || []
  );

  if (aAlpha === bAlpha) {
    return Number(aNum) > Number(bNum) ? 1 : -1;
  } else {
    return aAlpha > bAlpha ? 1 : -1;
  }
}
