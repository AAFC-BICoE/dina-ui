import { LoadingSpinner } from "common-ui";
import { noop } from "lodash";
import { SeqdbMessage } from "../../../../intl/seqdb-intl";
import { ContainerGrid } from "./ContainerGrid";
import { DraggableSampleList } from "./DraggableSampleList";
import { useSampleGridControls } from "./useSampleGridControls";

export interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
  libraryPrepBatch: LibraryPrepBatch;
}

export function SampleGrid(props: ContainerGridProps) {
  const { libraryPrepBatch } = props;

  const {
    availableSamples,
    cellGrid,
    clearGrid,
    fillMode,
    gridSubmit,
    loading,
    moveAll,
    movedSamples,
    onGridDrop,
    onListDrop,
    onSampleClick,
    selectedSamples,
    setFillMode
  } = useSampleGridControls(props);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  const { containerType } = libraryPrepBatch;
  if (!containerType) {
    return (
      <span className="alert alert-warning">
        Container Type must be set to use the container grid.
      </span>
    );
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
          <strong>Selected samples ({availableSamples.length} in list)</strong>
          <DraggableSampleList
            availableSamples={availableSamples}
            selectedSamples={selectedSamples}
            movedSamples={movedSamples}
            onClick={onSampleClick}
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
            containerType={containerType}
            cellGrid={cellGrid}
            movedSamples={movedSamples}
            onDrop={onGridDrop}
          />
        </div>
      </div>
    </div>
  );
}
