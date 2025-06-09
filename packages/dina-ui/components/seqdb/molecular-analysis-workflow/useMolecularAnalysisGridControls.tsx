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
  StorageUnit,
  StorageUnitType
} from "packages/dina-ui/types/collection-api";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { CellGrid } from "../container-grid/ContainerGrid";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { PersistedResource } from "kitsu";
import { MolecularAnalysisRunItemUsageType } from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

interface ContainerGridProps {
  molecularAnalysisId: string;
  molecularAnalysis: GenericMolecularAnalysis;
  editMode: boolean;
}

export interface MolecularAnalysisItemSample
  extends GenericMolecularAnalysisItem {
  sampleName?: string;
}

export function useMolecularAnalysisGridControls({
  molecularAnalysisId,
  molecularAnalysis,
  editMode
}: ContainerGridProps) {
  const { save, bulkGet } = useContext(ApiClientContext);

  const { compareByStringAndNumber } = useStringComparator();

  // Whether the grid is submitting.
  const [submitting, setSubmitting] = useState(false);

  // Highlighted/selected MolecularAnalysisItems.
  const [selectedItems, setSelectedItems] = useState<
    MolecularAnalysisItemSample[]
  >([]);
  const lastSelectedItemRef = useRef<MolecularAnalysisItemSample>();

  // Grid fill direction when you move multiple MolecularAnalysisItems into the grid.
  const [fillMode, setFillMode] = useState<"COLUMN" | "ROW">("COLUMN");

  const [numberOfColumns, setNumberOfColumns] = useState<number>(0);

  const [numberOfRows, setNumberOfRows] = useState<number>(0);

  const [isStorage, setIsStorage] = useState<boolean>(false);

  const [storageUnitType, setStorageUnitType] =
    useState<PersistedResource<StorageUnitType>>();

  const [storageUnit, setStorageUnit] =
    useState<PersistedResource<StorageUnit>>();

  const [loadedStorageUnit, setLoadedStorageUnit] =
    useState<PersistedResource<StorageUnit>>();

  const [initialStorageUnit, setInitialStorageUnit] =
    useState<PersistedResource<StorageUnit>>();

  const [multipleStorageUnitsWarning, setMultipleStorageUnitsWarning] =
    useState<boolean>(false);

  const [materialSampleSortOrder] = useLocalStorage<string[]>(
    `molecularAnalysisWorkflowMaterialSampleSortOrder-${molecularAnalysisId}`
  );

  const [gridState, setGridState] = useState({
    // Available MolecularAnalysisItems with no well coordinates.
    availableItems: [] as MolecularAnalysisItemSample[],
    // The grid of MolecularAnalysisItems that have well coordinates.
    cellGrid: {} as CellGrid<MolecularAnalysisItemSample>,
    // MolecularAnalysisItems that have been moved since data initialization.
    movedItems: [] as MolecularAnalysisItemSample[]
  });
  const [loadingRelationships, setLoadingRelationships] =
    useState<boolean>(false);

  // Boolean if the grid contains any of items.
  const gridIsPopulated = useMemo(
    () => !_.isEmpty(gridState.cellGrid),
    [gridState]
  );

  // MolecularAnalysisItems queries.
  const { loading: materialSampleItemsLoading } = useQuery<
    GenericMolecularAnalysisItem[]
  >(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "genericMolecularAnalysis.uuid",
            comparison: "==",
            arguments: molecularAnalysisId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `/seqdb-api/generic-molecular-analysis-item`,
      include: "materialSample,storageUnitUsage"
    },
    {
      onSuccess: async ({ data: molecularAnalysisItems }) => {
        if (!molecularAnalysisItems) return;

        /**
         * Fetch StorageUnitUsage linked to each MolecularAnalysisItems
         * @returns
         */
        async function fetchStorageUnitUsage() {
          if (!molecularAnalysisItems) return;

          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
            molecularAnalysisItems
              .filter((item) => item.storageUnitUsage?.id)
              .map(
                (item) =>
                  "/storage-unit-usage/" +
                  item.storageUnitUsage?.id +
                  "?include=storageUnit,storageUnit.storageUnitType"
              ),
            { apiBaseUrl: "/collection-api" }
          );

          const uniqueStorageUnitIds = new Set(
            storageUnitUsageQuery
              .filter((su) => su?.storageUnit)
              .map((su) => su?.storageUnit?.id)
          );

          // If more than one unique storage unit ID exists, then display a warning to the user.
          if (uniqueStorageUnitIds.size > 1) {
            setMultipleStorageUnitsWarning(true);
          }

          // Even if multiple exists, just use the first one found.
          if (uniqueStorageUnitIds.size !== 0) {
            const firstStorageUnitId = Array.from(uniqueStorageUnitIds)[0];
            const storageUnitToLoad = storageUnitUsageQuery.find(
              (su) => su?.storageUnit?.id === firstStorageUnitId
            )?.storageUnit;
            setStorageUnit(storageUnitToLoad);
            setLoadedStorageUnit(storageUnitToLoad);
            setInitialStorageUnit(storageUnitToLoad);
            setStorageUnitType(storageUnitToLoad?.storageUnitType);
          }

          const molecularAnalysisItemsWithStorageUnitUsage =
            molecularAnalysisItems.map((molecularAnalysisItem) => {
              const queryStorageUnitUsage = storageUnitUsageQuery.find(
                (storageUnitUsage) =>
                  storageUnitUsage?.id ===
                  molecularAnalysisItem.storageUnitUsage?.id
              );
              return {
                ...molecularAnalysisItem,
                wellColumn: queryStorageUnitUsage?.wellColumn,
                wellRow: queryStorageUnitUsage?.wellRow,
                storageUnitUsage: queryStorageUnitUsage
              };
            });
          molecularAnalysisItems = molecularAnalysisItemsWithStorageUnitUsage;
        }

        /**
         * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
         * operation.
         */
        async function fetchSamples(
          callback: (response: MaterialSample[]) => void
        ) {
          if (!molecularAnalysisItems) return;

          await bulkGet<MaterialSample>(
            molecularAnalysisItems
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
          const molecularAnalysisItemsWithSampleNames =
            materialSamples.map<MolecularAnalysisItemSample>((sample) => {
              const batchItem = molecularAnalysisItems.find(
                (item) => item.materialSample?.id === sample.id
              );
              return {
                ...batchItem,
                type: "generic-molecular-analysis-item",
                sampleId: sample.id,
                sampleName: sample?.materialSampleName ?? sample.id
              };
            });

          const molecularAnalysisItemsWithCoords =
            molecularAnalysisItemsWithSampleNames.filter(
              (item) =>
                item.storageUnitUsage?.wellRow &&
                item.storageUnitUsage?.wellColumn
            );

          const molecularAnalysisItemsNoCoords =
            molecularAnalysisItemsWithSampleNames.filter(
              (item) =>
                !item.storageUnitUsage?.wellRow &&
                !item.storageUnitUsage?.wellColumn
            );

          const newCellGrid: CellGrid<MolecularAnalysisItemSample> = {};
          molecularAnalysisItemsWithCoords.forEach((item) => {
            newCellGrid[
              `${item.storageUnitUsage?.wellRow}_${item.storageUnitUsage?.wellColumn}`
            ] = item;
          });

          setGridState({
            availableItems: sortAvailableItems(molecularAnalysisItemsNoCoords),
            cellGrid: newCellGrid,
            movedItems: []
          });
        });
        setLoadingRelationships(false);
      }
    }
  );

  // See if the storage unit has been selected yet.
  useEffect(() => {
    if (loadingRelationships === false) {
      if (
        storageUnit?.id &&
        storageUnitType?.id &&
        storageUnitType?.gridLayoutDefinition
      ) {
        if (loadedStorageUnit) {
          // User changed the storage unit to something new...
          if (
            loadedStorageUnit.id !== storageUnit.id ||
            loadedStorageUnit?.storageUnitType?.id !== storageUnitType?.id
          ) {
            clearGrid();
          }
        } else {
          setLoadedStorageUnit(storageUnit);
        }

        const gridLayoutDefinition = storageUnitType.gridLayoutDefinition;
        _.set(
          molecularAnalysis,
          "gridLayoutDefinition.numberOfColumns",
          gridLayoutDefinition.numberOfColumns
        );
        _.set(
          molecularAnalysis,
          "gridLayoutDefinition.numberOfRows",
          gridLayoutDefinition.numberOfRows
        );
        setNumberOfColumns(gridLayoutDefinition.numberOfColumns);
        setNumberOfRows(gridLayoutDefinition.numberOfRows);
        setFillMode(
          gridLayoutDefinition.fillDirection === "BY_ROW" ? "ROW" : "COLUMN"
        );
        setIsStorage(true);
      } else {
        setIsStorage(false);
      }
    }
  }, [loadingRelationships, storageUnit, storageUnitType]);

  useEffect(() => {
    if (editMode === false) {
      if (initialStorageUnit?.id !== storageUnit?.id) {
        setStorageUnit(initialStorageUnit);
        setStorageUnitType(initialStorageUnit?.storageUnitType);
      }
    }
  }, [editMode]);

  function sortAvailableItems(batchItemSamples: MolecularAnalysisItemSample[]) {
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

  function moveItems(items: MolecularAnalysisItemSample[], coords?: string) {
    setGridState(({ availableItems, cellGrid, movedItems }) => {
      // Remove the MolecularAnalysisItem from the grid.
      const newCellGrid: CellGrid<MolecularAnalysisItemSample> = _.omitBy(
        cellGrid,
        (item) => items.includes(item)
      );

      // Remove the MolecularAnalysisItem from the available MolecularAnalysisItem.
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

          // If there is already a MolecularAnalysisItem in this cell, move the existing
          // MolecularAnalysisItem back to the list.
          const itemAlreadyInThisCell = newCellGrid[thisItemCoords];
          if (itemAlreadyInThisCell) {
            newAvailableItems.push(itemAlreadyInThisCell);
            if (!movedItems.includes(itemAlreadyInThisCell)) {
              newMovedItems.push(itemAlreadyInThisCell);
            }
          }

          // Only move the MolecularAnalysisItem into the grid if the well is valid for this container type.
          if (newCellNumber <= numberOfColumns * numberOfRows) {
            // Move the MolecularAnalysisItem into the grid.
            newCellGrid[thisItemCoords] = item;
          } else {
            newAvailableItems.push(item);
          }

          newCellNumber++;
        }
      } else {
        // Add the MolecularAnalysisItem to the list.
        newAvailableItems = [...newAvailableItems, ...items];
      }

      // Set every MolecularAnalysisItem passed into this function as moved.
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

  function onGridDrop(item: MolecularAnalysisItemSample, coords: string) {
    if (selectedItems.includes(item)) {
      moveItems(selectedItems, coords);
    } else {
      moveItems([item], coords);
    }
  }

  function onListDrop(item: { batchItemSample: MolecularAnalysisItemSample }) {
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

      // If no storage unit, everything in the cell grid should be deleted.
      if (!storageUnit?.id || !storageUnitType?.gridLayoutDefinition) {
        const itemsToDelete = Object.entries(cellGrid).map((item) => item[1]);
        const deleteAllStorageUnitUsageArgs: DeleteArgs[] = itemsToDelete.map(
          (item) => ({
            delete: {
              id: item.storageUnitUsage?.id ?? "",
              type: "storage-unit-usage"
            }
          })
        );
        if (deleteAllStorageUnitUsageArgs.length) {
          await save<StorageUnitUsage>(deleteAllStorageUnitUsageArgs, {
            apiBaseUrl: "/collection-api"
          });
        }
        return;
      }

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
              storageUnit: _.pick(storageUnit, "id", "type") as any,
              type: "storage-unit-usage",
              id: item.storageUnitUsage?.id,
              usageType:
                MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM
            }
          }));
      const savedStorageUnitUsage = storageUnitUsageSaveArgs.length
        ? await save<StorageUnitUsage>(storageUnitUsageSaveArgs, {
            apiBaseUrl: "/collection-api"
          })
        : [];

      const saveArgs: SaveArgs<MolecularAnalysisItemSample>[] =
        materialSampleItemsToSave.map((item) => {
          const matchedStorageUnitUsage = savedStorageUnitUsage?.find?.(
            (storageUnitUsage) =>
              storageUnitUsage.wellColumn ===
                item.storageUnitUsage?.wellColumn &&
              storageUnitUsage.wellRow === item.storageUnitUsage?.wellRow
          );
          return {
            resource: {
              type: "generic-molecular-analysis-item",
              id: item.id,
              relationships: {
                storageUnitUsage: {
                  data: matchedStorageUnitUsage
                    ? _.pick(matchedStorageUnitUsage, "id", "type")
                    : null
                }
              }
            },
            type: "generic-molecular-analysis-item"
          };
        });

      await save<MolecularAnalysisItemSample>(saveArgs, {
        apiBaseUrl: "/seqdb-api"
      });

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
      if (deleteStorageUnitUsageArgs.length !== 0) {
        await save<StorageUnitUsage>(deleteStorageUnitUsageArgs, {
          apiBaseUrl: "/collection-api"
        });
      }
    } catch (err) {
      console.error(err);
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
    gridIsPopulated,
    storageUnitType,
    setStorageUnitType,
    storageUnit,
    setStorageUnit,
    multipleStorageUnitsWarning
  };
}
