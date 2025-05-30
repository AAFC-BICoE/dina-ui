import React from "react";
import { ContainerGrid } from "../../seqdb/container-grid/ContainerGrid";
import { MaterialSample, StorageUnit } from "../../../types/collection-api";
import { useState } from "react";
import { noop } from "lodash";
import { PersistedResource } from "kitsu";
import { LoadingSpinner, useDinaFormContext } from "common-ui";
import { ErrorBanner } from "../../error/ErrorBanner";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import FieldLabel from "common-ui/lib/label/FieldLabel";
import Link from "next/link";
import { useGridCoordinatesControls } from "./utils/useStorageUnitGridCoordinatesControls";

export interface StorageUnitGridProps {
  storageUnit: StorageUnit;
  materialSamples?: PersistedResource<MaterialSample>[];
}

export default function StorageUnitGrid({
  storageUnit,
  materialSamples
}: StorageUnitGridProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const {
    cellGrid,
    multipleSamplesWellCoordinates,
    usageType,
    editContentsPathRef,
    usageTypeLinkRef,
    usageTypeResourceNameRef
  } = useGridCoordinatesControls({
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
              wellCoordinate: coordinate.replace("_", ""),
              samples: samples.join(", ")
            })}
          />
        );
      })}
      <div>
        <FieldLabel name={formatMessage("usage")} className={"mb-2"} />
        <div className={"field-col mb-3"}>
          {usageType}{" "}
          {usageTypeLinkRef.current && (
            <Link href={usageTypeLinkRef.current}>
              {usageTypeResourceNameRef?.current}
            </Link>
          )}
        </div>
      </div>
      <div>
        {!readOnly && (
          <div className="d-flex justify-content-between align-items-end mb-3">
            <FieldLabel name={formatMessage("contents")} />
            {!!editContentsPathRef.current && (
              <Link
                href={`${editContentsPathRef.current}`}
                className={"btn btn-primary"}
              >
                <DinaMessage id="editContents" />
              </Link>
            )}
          </div>
        )}
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
