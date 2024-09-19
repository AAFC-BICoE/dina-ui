import React from "react";
import { CellGrid, ContainerGrid } from "../seqdb/container-grid/ContainerGrid";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { useState, useEffect, useRef } from "react";
import { isArray, noop } from "lodash";
import { PersistedResource } from "kitsu";
import { LoadingSpinner, useApiClient } from "../../../common-ui/lib";
import { StorageUnitUsage } from "../../types/collection-api/resources/StorageUnitUsage";
import {
  PcrBatch,
  PcrBatchItem,
  SeqBatch,
  SeqReaction
} from "../../types/seqdb-api";
import { ErrorBanner } from "../error/ErrorBanner";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import FieldLabel from "packages/common-ui/lib/label/FieldLabel";
import Link from "next/link";

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
  const {
    cellGrid,
    multipleSamplesWellCoordinates,
    usageTypeRef,
    pcrBatchRef
  } = useGridCoordinatesControls({
    materialSamples,
    storageUnit,
    setLoading
  });
  function parseUsageType(usageType) {
    const usageTypeMap = {
      "material-sample": "Material Sample",
      "pcr-batch-item": "PCR Batch",
      "seq-reaction": "Seq Batch"
    };
    return usageTypeMap[usageType];
  }

  return loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      {multipleSamplesWellCoordinates.current.map(({ coordinate, samples }) => {
        return (
          <ErrorBanner
            key={coordinate}
            errorMessage={formatMessage("multipleSamplesWellCoordinates", {
              wellCoordinate: coordinate.replace("_", ""),
              samples: samples.join(", ")
            })}
          />
        );
      })}
      <div>
        <FieldLabel name={formatMessage("usage")} />
        <div className={"field-col mb-3"}>
          {parseUsageType(usageTypeRef.current)}{" "}
          {usageTypeRef.current === "seq-reaction" && (
            <Link
              href={{
                pathname: `/seqdb/seq-batch/view`,
                query: {
                  id: pcrBatchRef?.current?.id
                }
              }}
            >
              <a>{pcrBatchRef?.current?.name}</a>
            </Link>
          )}
          {usageTypeRef.current === "pcr-batch-item" && (
            <Link
              href={{
                pathname: `/seqdb/pcr-batch/view`,
                query: {
                  id: pcrBatchRef?.current?.id
                }
              }}
            >
              <a>{pcrBatchRef?.current?.name}</a>
            </Link>
          )}
        </div>
      </div>
      <div>
        <FieldLabel name={formatMessage("contents")} />
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
    cellGrid: {} as CellGrid<any>,
    movedItems: [] as any[]
  });

  const usageTypeRef = useRef<string | undefined>(undefined);
  const pcrBatchRef = useRef<PersistedResource<PcrBatch>>();
  const seqBatchRef = useRef<PersistedResource<SeqBatch>>();

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
      usageTypeRef.current = storageUnitUsages[0]?.usageType;
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
              sampleName: materialSample.materialSampleName,
              sampleId: materialSample.id
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
        usageTypeRef.current = storageUnitUsagesQuery?.data?.[0]?.usageType;
        // Use map to return an array of promises
        const gridPromises = storageUnitUsagesQuery.data.map(
          async (storageUnitUsage, index) => {
            if (storageUnitUsage.usageType === "pcr-batch-item") {
              const pcrBatchItemQuery = await apiClient.get<PcrBatchItem[]>(
                `seqdb-api/pcr-batch-item`,
                {
                  include: `materialSample,${index === 0 ? "pcrBatch" : ""}`,
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const pcrBatchItem = pcrBatchItemQuery.data[0];
              if (pcrBatchItem.pcrBatch) {
                try {
                  const pcrBatchQuery = await apiClient.get<PcrBatch>(
                    `seqdb-api/pcr-batch/${pcrBatchItem.pcrBatch.id}`,
                    {}
                  );
                  pcrBatchRef.current = pcrBatchQuery.data;
                } catch (e) {
                  console.error(e);
                }
              }

              if (pcrBatchItem) {
                await getCellGrid(pcrBatchItem, storageUnitUsage);
              }
            } else if (storageUnitUsage.usageType === "seq-reaction") {
              const seqReactionQuery = await apiClient.get<SeqReaction[]>(
                `seqdb-api/seq-reaction`,
                {
                  include: `pcrBatchItem,${index === 0 ? "seqBatch" : ""}`,
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const seqReaction = seqReactionQuery.data[0];
              if (seqReaction.seqBatch) {
                try {
                  const pcrBatchQuery = await apiClient.get<PcrBatch>(
                    `seqdb-api/seq-batch/${seqReaction.seqBatch.id}`,
                    {}
                  );
                  pcrBatchRef.current = pcrBatchQuery.data;
                } catch (e) {
                  console.error(e);
                }
              }
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
        newCellGrid[key] = {
          sampleName: materialSample.materialSampleName,
          sampleId: materialSample.id
        };
      }
    }
  }

  useEffect(() => {
    getGridState();
  }, []);

  return {
    ...gridState,
    multipleSamplesWellCoordinates,
    usageTypeRef,
    pcrBatchRef
  };
}
