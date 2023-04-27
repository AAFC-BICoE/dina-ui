import { LoadingSpinner } from "common-ui";
import { noop } from "lodash";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import { useEffect } from "react";
import { ContainerGrid } from "./ContainerGrid";
import { DraggableSeqReactionList } from "./DraggableSeqReactionList";
import { useSeqSelectCoordinatesControls } from "./useSeqSelectCoordinatesControls";

export interface SeqBatchSelectCoordinatesStepProps {
  seqBatchId: string;
  seqBatch: SeqBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SeqBatchSelectCoordinatesStep(
  props: SeqBatchSelectCoordinatesStepProps
) {
  const {
    seqBatchId,
    seqBatch,
    editMode,
    setEditMode,
    performSave,
    setPerformSave
  } = props;
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
  } = useSeqSelectCoordinatesControls({
    seqBatchId,
    seqBatch
  });

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await gridSubmit();
      setPerformSave(false);
      setEditMode(false);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (!isStorage) {
    return (
      <div className="alert alert-warning mt-3">
        Storage definition must be set to use the container grid.
      </div>
    );
  }

  return (
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
                      onChange={noop}
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
          <DraggableSeqReactionList
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
            seqBatch={seqBatch}
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
