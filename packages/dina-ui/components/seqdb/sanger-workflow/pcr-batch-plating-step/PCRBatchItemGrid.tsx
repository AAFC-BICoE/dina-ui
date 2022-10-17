import { LoadingSpinner } from "common-ui";
import { noop } from "lodash";
import { SeqdbMessage } from "../../../../intl/seqdb-intl";
import { ContainerGrid } from "./ContainerGrid";
import { DraggablePCRBatchItemList } from "./DraggablePCRBatchItemList";
import { usePCRBatchItemGridControls } from "./usePCRBatchItemGridControls";

export interface PCRBatchItemGridProps {
    pcrBatchId: string;
}

export function PCRBatchItemGrid(props: PCRBatchItemGridProps) {
  const { pcrBatchId } = props;
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
    setFillMode
  } = usePCRBatchItemGridControls(props);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div>
      <div className="alert alert-warning d-inline-block">
        <SeqdbMessage id="sampleGridInstructions" />
      </div>
      <div className="row">
        <div className="col-3" />
        <div className="col-9">
          <ul className="list-inline d-inline">
            <li className="list-inline-item">
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
                    onClick={() => setFillMode(mode)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
          <div
            className="list-inline mb-3 d-inline"
            style={{ marginLeft: "10rem" }}
          >
            <button
              className="btn btn-dark list-inline-item grid-clear"
              onClick={clearGrid}
              type="button"
            >
              Clear Grid
            </button>
            <button
              className="btn btn-primary list-inline-item grid-submit"
              onClick={gridSubmit}
              type="button"
            >
              Save changed well coordinates
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-2">
          <strong>Selected pcr batch items ({availableItems.length} in list)</strong>
          <DraggablePCRBatchItemList
            availableItems={availableItems}
            selectedItems={selectedItems}
            movedItems={movedItems}
            onClick={onItemClick}
            onDrop={onListDrop}
          />
        </div>
        <div className="col-1">
          <button
            className="btn btn-primary move-all"
            onClick={moveAll}
            type="button"
          >
            Move All
          </button>
        </div>
        <div className="col-9">
          <strong>Container wells</strong>
          <ContainerGrid
            pcrBatchId={pcrBatchId}
            cellGrid={cellGrid}
            movedItems={movedItems}
            onDrop={onGridDrop}
          />
        </div>
      </div>
    </div>
  );
}
