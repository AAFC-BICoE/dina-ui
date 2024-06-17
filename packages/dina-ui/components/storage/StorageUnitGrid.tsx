import React from "react";
import { CellGrid, ContainerGrid } from "../seqdb/container-grid/ContainerGrid";
import { LoadingSpinner, useQuery } from "../../../common-ui/lib";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { useState, useEffect } from "react";
import { isArray } from "lodash";
import { noop } from "lodash";

export interface StorageUnitGridProps {
  storageUnit: StorageUnit;
}

export default function StorageUnitGrid({ storageUnit }: StorageUnitGridProps) {
  const { cellGrid, loading: loadingMaterialSamples } =
    useMaterialSampleSelectCoordinatesControls({
      storageUnit
    });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(loadingMaterialSamples);
  }, [loadingMaterialSamples]);

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
  storageUnit: StorageUnit;
}
export function useMaterialSampleSelectCoordinatesControls({
  storageUnit
}: MaterialSampleSelectCoordinatesControls) {
  const [gridState, setGridState] = useState({
    // The grid of SeqBatchItems that have well coordinates.
    cellGrid: {} as CellGrid<MaterialSample & { sampleName?: string }>,
    // SeqBatchItems that have been moved since data initialization.
    movedItems: [] as (MaterialSample & { sampleName?: string })[]
  });

  const newCellGrid: CellGrid<MaterialSample & { sampleName?: string }> = {};
  const materialSamplesQuery = useQuery<MaterialSample>(
    {
      path: "collection-api/material-sample",
      filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` },
      include: "storageUnitCoordinates"
    },
    {
      onSuccess(response) {
        if (isArray(response.data)) {
          response.data.forEach((item) => {
            newCellGrid[
              `${item.storageUnitCoordinates?.wellRow?.toUpperCase()}_${
                item.storageUnitCoordinates?.wellColumn
              }`
            ] = { sampleName: item.materialSampleName, ...item };
          });
        } else {
          newCellGrid[
            `${response.data.storageUnitCoordinates?.wellRow?.toUpperCase()}_${
              response.data.storageUnitCoordinates?.wellColumn
            }`
          ] = {
            sampleName: response.data.materialSampleName,
            ...response.data
          };
        }

        // Initialize grid state
        setGridState({
          cellGrid: newCellGrid,
          movedItems: []
        });
      }
    }
  );

  return { ...gridState, loading: materialSamplesQuery.loading };
}
