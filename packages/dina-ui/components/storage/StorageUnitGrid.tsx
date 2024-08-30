import React from "react";
import { CellGrid, ContainerGrid } from "../seqdb/container-grid/ContainerGrid";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { useState, useEffect, useRef } from "react";
import { isArray, noop } from "lodash";
import { PersistedResource } from "kitsu";
import { LoadingSpinner, useApiClient } from "../../../common-ui/lib";
import { StorageUnitUsage } from "../../types/collection-api/resources/StorageUnitUsage";
import { PcrBatchItem, SeqReaction } from "../../types/seqdb-api";
import { ErrorBanner } from "../error/ErrorBanner";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";

export interface StorageUnitGridProps {
  storageUnit: StorageUnit;
  materialSamples?: PersistedResource<MaterialSample>[];
}

export default function StorageUnitGrid({
  storageUnit,
  materialSamples
}: StorageUnitGridProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { formatMessage } = useDinaIntl();
  const { cellGrid, multipleSamplesWellCoordinates } =
    useGridCoordinatesControls({
      materialSamples,
      storageUnit,
      setLoading
    });

  return loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      {multipleSamplesWellCoordinates.current.map(({ coordinate, samples }) => {
        return (
          <ErrorBanner
            key={coordinate}
            errorMessage={formatMessage("multipleSamplesWellCoordinates", {
              wellCoordinate: coordinate,
              samples: samples.join(", ")
            })}
          />
        );
      })}
      <ContainerGrid
        className="mb-3"
        batch={{
          gridLayoutDefinition:
            storageUnit?.storageUnitType?.gridLayoutDefinition
        }}
        cellGrid={cellGrid}
        editMode={false}
        movedItems={[]}
        onDrop={noop}
      />
    </div>
  );
}

export interface GridCoordinatesControls {
  materialSamples?: PersistedResource<MaterialSample>[] | undefined;
  storageUnit: StorageUnit;
  setLoading?: (isLoading: boolean) => void;
}
export function useGridCoordinatesControls({
  materialSamples,
  storageUnit,
  setLoading
}: GridCoordinatesControls) {
  const [gridState, setGridState] = useState({
    cellGrid: {} as CellGrid<MaterialSample & { sampleName?: string }>,
    movedItems: [] as (MaterialSample & { sampleName?: string })[]
  });

  // Change to track an array of objects with well coordinate and associated samples.
  const multipleSamplesWellCoordinates = useRef<
    { coordinate: string; samples: string[] }[]
  >([]);

  const { apiClient } = useApiClient();

  async function getGridState() {
    setLoading?.(true);
    const newCellGrid: CellGrid<any> = {};
    if (isArray(materialSamples) && materialSamples.length > 0) {
      const storageUnitUsages = materialSamples.map(
        (sample) => sample.storageUnitUsage
      );
      materialSamples.forEach((materialSample) => {
        const storageUnitUsage = storageUnitUsages.find(
          (usage) => usage?.id === materialSample?.storageUnitUsage?.id
        );
        if (storageUnitUsage) {
          const key = `${storageUnitUsage?.wellRow?.toUpperCase()}_${
            storageUnitUsage?.wellColumn
          }`;

          if (newCellGrid[key]) {
            // Update the existing entry for multiple samples
            const existingEntry = multipleSamplesWellCoordinates.current.find(
              (entry) => entry.coordinate === key
            );

            if (existingEntry) {
              existingEntry.samples.push(
                materialSample.materialSampleName ?? ""
              );
            } else {
              multipleSamplesWellCoordinates.current.push({
                coordinate: key,
                samples: [
                  newCellGrid[key].sampleName,
                  materialSample.materialSampleName
                ]
              });
            }
          } else {
            newCellGrid[key] = {
              sampleName: materialSample.materialSampleName
            };
          }
        }
      });
    }

    try {
      const storageUnitUsagesQuery = await apiClient.get<StorageUnitUsage[]>(
        "collection-api/storage-unit-usage/",
        {
          include: "storageUnit",
          filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` }
        }
      );

      if (storageUnitUsagesQuery.data.length > 0) {
        // Use map to return an array of promises
        const gridPromises = storageUnitUsagesQuery.data.map(
          async (storageUnitUsage) => {
            if (storageUnitUsage.usageType === "pcr-batch-item") {
              const pcrBatchItemQuery = await apiClient.get<PcrBatchItem[]>(
                `seqdb-api/pcr-batch-item`,
                {
                  include: "materialSample",
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const pcrBatchItem = pcrBatchItemQuery.data[0];
              if (pcrBatchItem) {
                await getCellGrid(pcrBatchItem, storageUnitUsage);
              }
            } else if (storageUnitUsage.usageType === "seq-reaction") {
              const seqReactionQuery = await apiClient.get<SeqReaction[]>(
                `seqdb-api/seq-reaction`,
                {
                  include: "pcrBatchItem",
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const seqReaction = seqReactionQuery.data[0];
              if (seqReaction && seqReaction.pcrBatchItem) {
                await getCellGrid(seqReaction.pcrBatchItem, storageUnitUsage);
              }
            } else {
              console.error("Unexpected usage type.");
            }
          }
        );

        // Await all the promises
        await Promise.all(gridPromises);
      }

      // Initialize grid state
      setGridState({
        cellGrid: newCellGrid,
        movedItems: []
      });
    } catch (error) {
      console.error("Error fetching grid state:", error);
    } finally {
      // Ensure setLoading is called after all async operations complete
      setLoading?.(false);
    }

    async function getCellGrid(
      pcrBatchItem,
      storageUnitUsage: PersistedResource<StorageUnitUsage>
    ) {
      const pcrBatchItemWithMaterialSampleIdQuery =
        await apiClient.get<PcrBatchItem>(
          `seqdb-api/pcr-batch-item/${pcrBatchItem?.id}`,
          {
            include: "materialSample"
          }
        );
      const pcrBatchItemWithMaterialSampleId =
        pcrBatchItemWithMaterialSampleIdQuery.data;
      const materialSampleQuery = await apiClient.get<MaterialSample>(
        `collection-api/material-sample/${pcrBatchItemWithMaterialSampleId.materialSample?.id}`,
        {}
      );
      const materialSample = materialSampleQuery.data;
      const key = `${storageUnitUsage?.wellRow?.toUpperCase()}_${
        storageUnitUsage?.wellColumn
      }`;

      if (newCellGrid[key]) {
        // Update the existing entry for multiple samples
        const existingEntry = multipleSamplesWellCoordinates.current.find(
          (entry) => entry.coordinate === key
        );

        if (existingEntry) {
          existingEntry.samples.push(materialSample.materialSampleName ?? "");
        } else {
          multipleSamplesWellCoordinates.current.push({
            coordinate: key,
            samples: [
              newCellGrid[key].sampleName,
              materialSample.materialSampleName
            ]
          });
        }
      } else {
        newCellGrid[key] = { sampleName: materialSample.materialSampleName };
      }
    }
  }

  useEffect(() => {
    getGridState();
  }, []);

  return { ...gridState, multipleSamplesWellCoordinates };
}
