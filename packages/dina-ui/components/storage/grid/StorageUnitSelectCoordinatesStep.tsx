import { useEffect } from "react";
import _ from "lodash";
import { LoadingSpinner } from "../../../../common-ui/lib";
import { ContainerGrid } from "../../seqdb/container-grid/ContainerGrid";
import { DraggableItemList } from "../../seqdb/container-grid/DraggableItemList";
import { MaterialSample, StorageUnit } from "../../../types/collection-api";
import { useMaterialSampleGridControls } from "./utils/useMaterialSampleGridControls";

interface StorageUnitSelectCoordinatesStepProps {
  onSaved: (nextStep?: number) => Promise<void>;
  performSave: boolean;
  editMode: boolean;
  storageUnit: StorageUnit;
  currentStep: number;
}

export function StorageUnitSelectCoordinatesStep({
  onSaved,
  performSave,
  editMode,
  storageUnit,
  currentStep
}: StorageUnitSelectCoordinatesStepProps) {
  const {
    availableItems,
    cellGrid,
    clearGrid,
    fillMode,
    gridSubmit,
    loading,
    moveAll,
    movedItems,
    onGridDrop,
    onListDrop,
    onItemClick,
    selectedItems,
    setFillMode,
    isStorage,
    gridIsPopulated
  } = useMaterialSampleGridControls({
    storageUnit,
    currentStep
  });

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await gridSubmit();
      await onSaved();
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  if (!isStorage) {
    return (
      <div className="mt-3">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-warning">
              Storage definition must be set to use the container grid.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div className="mt-3">
      {editMode && (
        <div className="row">
          <div className="col-3" />
          <div className="col-9">
            <ul style={{ float: "left" }} className="p-0 mt-3">
              <li className="list-inline-item fill-by">
                <strong>Fill by:</strong>
              </li>
              {[
                { label: "Row", mode: "ROW" },
                { label: "Column", mode: "COLUMN" }
              ].map(({ label, mode }) => (
                <li className="list-inline-item" key={mode}>
                  <label>
                    <input
                      className={`${mode}-radio`}
                      type="radio"
                      checked={fillMode === mode}
                      onChange={_.noop}
                      onClick={() =>
                        setFillMode(mode === "ROW" ? "ROW" : "COLUMN")
                      }
                    />
                    {label}
                  </label>
                </li>
              ))}
            </ul>
            <div style={{ float: "right" }}>
              <button
                className="btn btn-dark list-inline-item grid-clear"
                onClick={clearGrid}
                type="button"
              >
                Clear Grid
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-2">
          <strong>
            Selected Material Samples ({availableItems.length} in list)
          </strong>
          <DraggableItemList<
            MaterialSample & { sampleName?: string; sampleId?: string }
          >
            availableItems={availableItems}
            selectedItems={selectedItems}
            movedItems={movedItems}
            onClick={onItemClick}
            onDrop={onListDrop}
            editMode={editMode}
          />
        </div>
        <div className="col-1">
          {editMode && (
            <button
              className="btn btn-primary move-all w-100"
              onClick={moveAll}
              type="button"
              disabled={gridIsPopulated}
            >
              Move All
            </button>
          )}
        </div>
        <div className="col-9">
          <strong>Container wells</strong>
          <ContainerGrid
            batch={{
              gridLayoutDefinition:
                storageUnit?.storageUnitType?.gridLayoutDefinition
            }}
            cellGrid={cellGrid}
            movedItems={movedItems}
            onDrop={onGridDrop}
            editMode={editMode}
          />
        </div>
      </div>
    </div>
  );
}
