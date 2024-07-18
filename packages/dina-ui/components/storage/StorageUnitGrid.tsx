import React from "react";
import { CellGrid, ContainerGrid } from "../seqdb/container-grid/ContainerGrid";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { useState, useEffect } from "react";
import { isArray, noop } from "lodash";
import { PersistedResource } from "kitsu";

export interface StorageUnitGridProps {
  storageUnit: StorageUnit;
  materialSamples: PersistedResource<MaterialSample>[] | undefined;
}

export default function StorageUnitGrid({
  storageUnit,
  materialSamples
}: StorageUnitGridProps) {
  const { cellGrid } = useMaterialSampleSelectCoordinatesControls({
    materialSamples
  });

  return (
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
  materialSamples: PersistedResource<MaterialSample>[] | undefined;
}
export function useMaterialSampleSelectCoordinatesControls({
  materialSamples
}: MaterialSampleSelectCoordinatesControls) {
  const [gridState, setGridState] = useState({
    // The grid of SeqBatchItems that have well coordinates.
    cellGrid: {} as CellGrid<MaterialSample & { sampleName?: string }>,
    // SeqBatchItems that have been moved since data initialization.
    movedItems: [] as (MaterialSample & { sampleName?: string })[]
  });

  useEffect(() => {
    const newCellGrid: CellGrid<MaterialSample & { sampleName?: string }> = {};
    if (isArray(materialSamples)) {
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
          ] = { sampleName: item.materialSampleName, ...item };
        }
      });
    }

    // Initialize grid state
    setGridState({
      cellGrid: newCellGrid,
      movedItems: []
    });
  }, []);

  return { ...gridState };
}
