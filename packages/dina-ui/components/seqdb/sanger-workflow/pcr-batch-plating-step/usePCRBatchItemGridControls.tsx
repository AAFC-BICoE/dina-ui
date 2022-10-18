import { ApiClientContext, filterBy, useQuery } from "common-ui";
import { omitBy } from "lodash";
import { useContext, useRef, useState, useEffect } from "react";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { CellGrid } from "./ContainerGrid";

interface ContainerGridProps {
  pcrBatchId: string;
}

export function usePCRBatchItemGridControls({
  pcrBatchId
}: ContainerGridProps) {
  const { apiClient, save } = useContext(ApiClientContext);

  const [itemsLoading, setItemsLoading] = useState<boolean>(true);

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected PcrBatchItems.
  const [selectedItems, setSelectedItems] = useState<PcrBatchItem[]>([]);
  const lastSelectedItemRef = useRef<PcrBatchItem>();

  // Grid fill direction when you move multiple PcrBatchItems into the grid.
  const [fillMode, setFillMode] = useState<string>("COLUMN");

  const [lastSave, setLastSave] = useState<number>();

  const [pcrBatch, setPcrBatch] = useState<PcrBatch>();

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [ pcrBatchItem, setPcrBatchItem] = useState<PcrBatchItem>();

  const [ isStorage, setIsStorage ] = useState<boolean>(false);

  async function getPcrBatch(){
    await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${pcrBatchId}`,
      {}
    )
    .then((response) => {
      setPcrBatch(response?.data);
    });
  }

  useEffect(() => {
  getPcrBatch();
  
  if(pcrBatch?.storageRestriction !== undefined && pcrBatch?.storageRestriction !== null){
    setNumberOfColumns(pcrBatch.storageRestriction.layout.numberOfColumns);
    setNumberOfRows(pcrBatch.storageRestriction.layout.numberOfRows);
    setIsStorage(true);
  }
});

  const [gridState, setGridState] = useState({
    // Available PcrBatchItems with no well coordinates.
    availableItems: [] as PcrBatchItem[],
    // The grid of PcrBatchItems that have well coordinates.
    cellGrid: {} as CellGrid,
    // PcrBatchItems that have been moved since data initialization.
    movedItems: [] as PcrBatchItem[]
  });

  // PcrBatchItem queries.
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

          const pcrBatchItemsNoCoords = pcrBatchItems.filter(
            item => !item.wellRow && !item.wellColumn
          );

          const newCellGrid: CellGrid = {};
          if(pcrBatchItem != null)
          for (const {
            wellRow,
            wellColumn
          } of pcrBatchItemsWithCoords) {
            newCellGrid[`${wellRow}_${wellColumn}`] = pcrBatchItem;
          }

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
      // Remove the PcrBatchItem from the grid.
      const newCellGrid: CellGrid = omitBy(cellGrid, s => items.includes(s));

      // Remove the PcrBatchItem from the availables PcrBatchItems.
      let newAvailableItems = availableItems.filter(
        s => !items.includes(s)
      );
      const newMovedItems = [...movedItems];

      if (coords) {
        const [rowLetter, colNumberString] = coords.split("_");
        const rowNumber = rowLetter.charCodeAt(0) - 64;

        //double check this part
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
        availableItems: newAvailableItems,
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

      const pcrBatchItemsToSave = movedItems.map(movedItem => {
        // Get the coords from the cell grid.
        const coords = Object.keys(cellGrid).find(
          key => cellGrid[key] === movedItem
        );

        let newWellColumn: number | undefined;
        let newWellRow: string | undefined;
        if (coords) {
          const [row , col] = coords.split("_");
          newWellColumn = Number(col);
          newWellRow = row;
        }

        movedItem.wellColumn = newWellColumn;
        movedItem.wellRow = newWellRow;

        return movedItem;
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
    const items = [...availableItems, ...Object.values(cellGrid)]
    // const items = [...availableItems, ...Object.values(cellGrid)].sort(
    //   itemSort
    // );
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
    setFillMode,
    isStorage
  };
}

// function itemSort(a, b) {
//   const [[aAlpha, aNum], [bAlpha, bNum]] = [a, b].map(
//     s => s.match(/[^\d]+|\d+/g) || []
//   );

//   if (aAlpha === bAlpha) {
//     return Number(aNum) > Number(bNum) ? 1 : -1;
//   } else {
//     return aAlpha > bAlpha ? 1 : -1;
//   }
// }
