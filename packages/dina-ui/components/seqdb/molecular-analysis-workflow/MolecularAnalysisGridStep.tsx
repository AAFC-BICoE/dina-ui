import {
  AreYouSureModal,
  filterBy,
  LoadingSpinner,
  ResourceSelect,
  useModal
} from "common-ui";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import { useEffect, useState } from "react";
import {
  MolecularAnalysisItemSample,
  useMolecularAnalysisGridControls
} from "./useMolecularAnalysisGridControls";
import { DraggableItemList } from "../container-grid/DraggableItemList";
import { ContainerGrid } from "../container-grid/ContainerGrid";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import {
  StorageUnit,
  StorageUnitType
} from "packages/dina-ui/types/collection-api";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export interface MolecularAnalysisGridStepProps {
  molecularAnalysisId: string;
  molecularAnalysis: GenericMolecularAnalysis;
  onSaved: (
    nextStep: number,
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MolecularAnalysisGridStep({
  molecularAnalysisId,
  molecularAnalysis,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: MolecularAnalysisGridStepProps) {
  const { openModal } = useModal();

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
    gridIsPopulated,
    storageUnitType,
    setStorageUnitType,
    storageUnit,
    setStorageUnit,
    multipleStorageUnitsWarning
  } = useMolecularAnalysisGridControls({
    molecularAnalysisId,
    molecularAnalysis,
    editMode
  });

  const [pageLoaded, setPageLoaded] = useState<boolean>(false);

  // Automatically go into edit mode if no storage units exist.
  useEffect(() => {
    if (loading === false && pageLoaded === false) {
      if (isStorage === false) {
        setEditMode(true);
      }
      setPageLoaded(true);
    }
  }, [loading, isStorage, pageLoaded]);

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await gridSubmit();
      setPerformSave(false);
      await onSaved(3);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  /**
   * Since this step is optional, the user can skip and go directly to the next step.
   */
  function skipStep() {
    async function performSkipInternal() {
      setPerformSave(false);
      await onSaved(3);
    }

    performSkipInternal();
  }

  return (
    <>
      {multipleStorageUnitsWarning && (
        <div className="col-12">
          <div className="alert alert-danger">
            Multiple storage units have been found for the molecular analysis
            items.
          </div>
        </div>
      )}
      {editMode === false && !storageUnit?.id && (
        <div className="col-12">
          <div className="alert alert-info">
            No coordinates have been saved yet, click "Edit" to begin adding
            coordinates.
          </div>
        </div>
      )}
      {!storageUnit?.id && !storageUnitType?.id && editMode === true && (
        <div className="row">
          <div className="col-md-12">
            <button
              className="btn btn-secondary w-100 mb-4"
              onClick={skipStep}
              type="button"
            >
              Skip Step
            </button>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-6">
          {!(editMode === false && !storageUnit?.id) && (
            <strong>
              <DinaMessage id="storageUnitType" />
            </strong>
          )}
          <div className="mt-2">
            {editMode ? (
              <ResourceSelect<StorageUnitType>
                model="collection-api/storage-unit-type"
                optionLabel={(it) => it.name}
                filter={filterBy(["name"])}
                onChange={(value) => {
                  if (storageUnitType?.id !== undefined) {
                    openModal(
                      <AreYouSureModal
                        actionMessage={<DinaMessage id="areYouSure" />}
                        messageBody={
                          <DinaMessage id="changingTheStorageUnitTypeWillDeleteWarning" />
                        }
                        yesButtonText={
                          <DinaMessage id="changingTheStorageUnitTypeWillDeleteWarningButtonText" />
                        }
                        noButtonText={<DinaMessage id="cancelButtonText" />}
                        onYesButtonClicked={() => {
                          setStorageUnitType(
                            value as PersistedResource<StorageUnitType>
                          );
                          setStorageUnit(undefined);
                        }}
                      />
                    );
                  } else {
                    setStorageUnitType(
                      value as PersistedResource<StorageUnitType>
                    );
                    setStorageUnit(undefined);
                  }
                }}
                value={storageUnitType}
              />
            ) : (
              <p>{storageUnitType?.name}</p>
            )}
          </div>
        </div>
        <div className="col-md-6">
          {storageUnitType?.id && (
            <strong>
              <DinaMessage id="field_storageUnit" />
            </strong>
          )}
          <div className="mt-2">
            {editMode ? (
              <>
                {storageUnitType?.id && (
                  <ResourceSelect<StorageUnit>
                    model="collection-api/storage-unit"
                    optionLabel={(it) => it.name}
                    filter={filterBy(["name"], {
                      extraFilters: [
                        {
                          selector: "storageUnitType.uuid",
                          comparison: "==",
                          arguments: storageUnitType?.id ?? ""
                        }
                      ]
                    })}
                    onChange={(value) =>
                      setStorageUnit(value as PersistedResource<StorageUnit>)
                    }
                    value={storageUnit}
                    isDisabled={!storageUnitType?.id}
                  />
                )}
              </>
            ) : (
              <p>{storageUnit?.name}</p>
            )}
          </div>
        </div>
      </div>
      {storageUnitType?.id && !storageUnitType?.gridLayoutDefinition && (
        <div className="mt-3">
          <div className="row">
            <div className="col-12">
              <div className="alert alert-warning">
                The currently selected storage unit does not contain a container
                grid in order to use the storage selector.
              </div>
            </div>
          </div>
        </div>
      )}
      {isStorage && storageUnitType?.gridLayoutDefinition && (
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
              <DraggableItemList<MolecularAnalysisItemSample>
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
              <ContainerGrid<
                GenericMolecularAnalysis & { gridLayoutDefinition?: any },
                MolecularAnalysisItemSample
              >
                batch={molecularAnalysis}
                cellGrid={cellGrid}
                movedItems={movedItems}
                onDrop={onGridDrop}
                editMode={editMode}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
