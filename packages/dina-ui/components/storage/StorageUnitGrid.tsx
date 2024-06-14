import React from "react";
import { CellGrid, ContainerGrid } from "../seqdb/container-grid/ContainerGrid";
import { LoadingSpinner, useQuery } from "../../../common-ui/lib";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { KitsuResource, PersistedResource } from "kitsu";
import { useState } from "react";
import { isArray } from "lodash";

export interface StorageUnitGridProps {
  storageUnit: StorageUnit;
}

export default function StorageUnitGrid({ storageUnit }: StorageUnitGridProps) {
  const [storageUnitContents, setStorageUnitContents] = useState<
    PersistedResource<any>[]
  >([]);
  const materialSamplesQuery = useQuery(
    {
      path: "collection-api/material-sample",
      filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` },
      include: "storageUnitCoordinates"
    },
    {
      onSuccess(response) {
        if (isArray(response.data)) {
          setStorageUnitContents([...storageUnitContents, ...response.data]);
        } else {
          setStorageUnitContents([...storageUnitContents, response.data]);
        }
      }
    }
  );
  const cellGrid: CellGrid<any> = {};
  storageUnitContents.forEach((item) => {
    cellGrid[
      `${item.storageUnitCoordinates?.wellRow}_${item.storageUnitCoordinates?.wellColumn}`
    ] = { sampleName: item.materialSampleName, ...item };
  });

  return materialSamplesQuery.loading ? (
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
        movedItems={[]}
        onDrop={(
          item: { sampleName?: string | undefined },
          coords: string
        ): void => {
          throw new Error("Function not implemented.");
        }}
        editMode={false}
      />
    </div>
  );
}
