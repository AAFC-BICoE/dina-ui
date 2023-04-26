import { ApiClientContext, filterBy, useQuery } from "common-ui";
import { omitBy, compact, isEmpty } from "lodash";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useContext, useRef, useState, useEffect, useMemo } from "react";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { CellGrid } from "./ContainerGrid";

interface ContainerGridProps {
  pcrBatchId: string;
  pcrBatch: PcrBatch;
}

export interface PcrBatchItemSample {
  pcrBatchItemId?: string;
  wellRow?: string;
  wellColumn?: number;
  sampleId?: string;
  sampleName?: string;
}

export function usePCRBatchItemGridControls({
  pcrBatchId,
  pcrBatch
}: ContainerGridProps) {
  const { save, bulkGet } = useContext(ApiClientContext);

  const [itemsLoading, setItemsLoading] = useState<boolean>(true);

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

  const [pcrBatchItems, setPcrBatchItems] = useState<PcrBatchItemSample[]>();

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [gridState, setGridState] = useState({
    // Available PcrBatchItems with no well coordinates.
    availableItems: [] as PcrBatchItemSample[],
    // The grid of PcrBatchItems that have well coordinates.
    cellGrid: {} as CellGrid,
    // PcrBatchItems that have been moved since data initialization.
    movedItems: [] as PcrBatchItemSample[]
  });

  // Boolean if the grid contains any of items.
  const gridIsPopulated = useMemo(
    () => !isEmpty(gridState.cellGrid),
    [gridState]
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

  useEffect(() => {
    if (!pcrBatchItems) return;

    fetchSamples((materialSamples) => {
      const pcrBatchItemsWithSampleNames =
        materialSamples.map<PcrBatchItemSample>((sample) => {
          const batchItem = pcrBatchItems.find(
            (item) => item.sampleId === sample.id
          );
          return {
            pcrBatchItemId: batchItem?.pcrBatchItemId,
            sampleId: sample.id,
            sampleName: sample?.materialSampleName ?? sample.id,
            wellColumn: batchItem?.wellColumn,
            wellRow: batchItem?.wellRow
          };
        });

      const pcrBatchItemsWithCoords = pcrBatchItemsWithSampleNames.filter(
        (item) => item.wellRow && item.wellColumn
      );

      const pcrBatchItemsNoCoords = pcrBatchItemsWithSampleNames.filter(
        (item) => !item.wellRow && !item.wellColumn
      );

      const newCellGrid: CellGrid = {};
      pcrBatchItemsWithCoords.forEach((item) => {
        newCellGrid[`${item.wellRow}_${item.wellColumn}`] = item;
      });

      setGridState({
        availableItems: pcrBatchItemsNoCoords?.sort(itemSort),
        cellGrid: newCellGrid,
        movedItems: []
      });
      setItemsLoading(false);
    });
  }, [pcrBatchItems]);

  /**
   * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
   * operation.
   */
  async function fetchSamples(callback: (response: MaterialSample[]) => void) {
    if (!pcrBatchItems) return;

    await bulkGet<MaterialSample>(
      pcrBatchItems
        .filter((item) => item.sampleId)
        .map((item) => "/material-sample/" + item.sampleId),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      const materialSamplesTransformed = compact(response).map<MaterialSample>(
        (resource) => ({
          materialSampleName: resource.materialSampleName,
          id: resource.id,
          type: resource.type
        })
      );

      callback(materialSamplesTransformed);
    });
  }

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
      include: "materialSample"
    },
    {
      deps: [lastSave],
      onSuccess: async ({ data: pcrBatchItem }) => {
        setItemsLoading(true);
        setPcrBatchItems(
          pcrBatchItem.map((item) => ({
            pcrBatchItemId: item.id,
            sampleId: item?.materialSample?.id,
            wellColumn: item.wellColumn,
            wellRow: item.wellRow
          }))
        );
      }
    }
  );

  function moveItems(items: PcrBatchItemSample[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the PcrBatchItem from the grid.
      const newCellGrid: CellGrid = omitBy(cellGrid, (item) =>
        items.includes(item)
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

  function onListDrop(item: { pcrBatchItemSample: PcrBatchItemSample }) {
    moveItems([item.pcrBatchItemSample]);
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

        movedItem.wellColumn = newWellColumn;
        movedItem.wellRow = newWellRow;

        return movedItem;
      });

      const saveArgs = materialSampleItemsToSave.map((item) => {
        return {
          resource: {
            type: "pcr-batch-item",
            id: item.pcrBatchItemId,
            wellColumn: item.wellColumn ?? null,
            wellRow: item.wellRow ?? null
          } as PcrBatchItem,
          type: "pcr-batch-item"
        };
      });

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
    // Do not perform the move if the grid contains anything.
    // Eventually we should be able to handle this case properly.
    if (gridIsPopulated) return;

    const { availableItems, cellGrid } = gridState;
    const items = [...availableItems, ...Object.values(cellGrid)].sort(
      itemSort
    );
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

function itemSort(a, b) {
  const [[aAlpha, aNum], [bAlpha, bNum]] = [a, b].map(
    (s) => s.sampleName.match(/[^\d]+|\d+/g) || []
  );

  if (aAlpha === bAlpha) {
    return Number(aNum) > Number(bNum) ? 1 : -1;
  } else {
    return aAlpha > bAlpha ? 1 : -1;
  }
}
