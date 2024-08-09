import React from "react";
import { CellGrid, ContainerGrid } from "../seqdb/container-grid/ContainerGrid";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { useState, useEffect } from "react";
import { isArray, noop } from "lodash";
import { PersistedResource } from "kitsu";
import { LoadingSpinner, useApiClient } from "../../../common-ui/lib";
import { StorageUnitUsage } from "../../types/collection-api/resources/StorageUnitUsage";
import { PcrBatchItem, SeqReaction } from "../../types/seqdb-api";

export interface StorageUnitGridProps {
  storageUnit: StorageUnit;
  materialSamples?: PersistedResource<MaterialSample>[];
}

export default function StorageUnitGrid({
  storageUnit,
  materialSamples
}: StorageUnitGridProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { cellGrid } = useGridCoordinatesControls({
    materialSamples,
    storageUnit,
    setLoading
  });

  return loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      <ContainerGrid
        className="mb-3"
        batch={{
          storageRestriction: {
            layout: storageUnit?.storageUnitType?.gridLayoutDefinition
          }
        }}
        cellGrid={cellGrid}
        editMode={false}
        movedItems={[]}
        onDrop={noop}
      />
    </div>
  );
}

export interface MaterialSampleSelectCoordinatesControls {
  materialSamples?: PersistedResource<MaterialSample>[] | undefined;
  storageUnit: StorageUnit;
  setLoading?: (isLoading: boolean) => void;
}
export function useGridCoordinatesControls({
  materialSamples,
  storageUnit,
  setLoading
}: MaterialSampleSelectCoordinatesControls) {
  const [gridState, setGridState] = useState({
    // The grid of SeqBatchItems that have well coordinates.
    cellGrid: {} as CellGrid<MaterialSample & { sampleName?: string }>,
    // SeqBatchItems that have been moved since data initialization.
    movedItems: [] as (MaterialSample & { sampleName?: string })[]
  });
  const { apiClient } = useApiClient();

  async function fetchStorageUnitUsages() {
    const newCellGrid: CellGrid<any> = {};
    try {
      setLoading?.(true);
      const storageUnitUsagesQuery = await apiClient.get<StorageUnitUsage[]>(
        "collection-api/storage-unit-usage/",
        {
          include: "storageUnit",
          filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` }
        }
      );
      if (storageUnitUsagesQuery.data.length > 0) {
        storageUnitUsagesQuery.data.forEach(async (storageUnitUsage) => {
          if (storageUnitUsage.usageType === "pcr-batch-item") {
            const pcrBatchItemQuery = await apiClient.get<PcrBatchItem[]>(
              `seqdb-api/pcr-batch-item`,
              {
                include: "materialSample",
                filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
              }
            );
            const pcrBatchItem = pcrBatchItemQuery.data[0];
            await getCellGrid(pcrBatchItem, storageUnitUsage);
          } else if (storageUnitUsage.usageType === "seq-reaction") {
            const seqReactionQuery = await apiClient.get<SeqReaction[]>(
              `seqdb-api/seq-reaction`,
              {
                include: "pcrBatchItem",
                filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
              }
            );
            const seqReaction = seqReactionQuery.data[0];
            const pcrBatchItem = seqReaction.pcrBatchItem;
            await getCellGrid(pcrBatchItem, storageUnitUsage);
          } else {
            console.error("Unexpected usage type.");
          }
        });
      }
      setLoading?.(false);
    } catch (error) {
      throw error;
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
      newCellGrid[
        `${storageUnitUsage?.wellRow?.toUpperCase()}_${
          storageUnitUsage?.wellColumn
        }`
      ] = { sampleName: materialSample.materialSampleName };
      // Initialize grid state
      setGridState({
        cellGrid: newCellGrid,
        movedItems: []
      });
    }
  }

  useEffect(() => {
    if (isArray(materialSamples) && materialSamples.length > 0) {
      const newCellGrid: CellGrid<any> = {};
      const storageUnitUsages = materialSamples?.map(
        (sample) => sample.storageUnitUsage
      );
      materialSamples.forEach((item) => {
        const storageUnitUsage = storageUnitUsages?.find(
          (usage) => usage?.id === item?.storageUnitUsage?.id
        );
        if (storageUnitUsage) {
          newCellGrid[
            `${storageUnitUsage?.wellRow?.toUpperCase()}_${
              storageUnitUsage?.wellColumn
            }`
          ] = { sampleName: item.materialSampleName };
        }
      });
      // Initialize grid state
      setGridState({
        cellGrid: newCellGrid,
        movedItems: []
      });
    } else {
      fetchStorageUnitUsages();
    }
  }, []);

  return { ...gridState };
}
