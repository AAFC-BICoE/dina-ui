import { noop } from "lodash";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import { LoadingSpinner } from "../../..";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrepBatch
} from "../../../../types/seqdb-api";
import { ContainerGrid } from "./ContainerGrid";
import { DraggableSampleList } from "./DraggableSampleList";
import { useSampleGridControls } from "./useSampleGridControls";

interface ContainerGridProps {
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
  } else {
    return (
      <DndProvider backend={HTML5Backend}>
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
            <button
              className="float-right btn btn-dark d-inline"
              onClick={clearGrid}
              type="button"
            >
              Clear Grid
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-2">
            <strong>Selected samples</strong>
            <DraggableSampleList
              availableSamples={availableSamples}
              selectedSamples={selectedSamples}
              movedSamples={movedSamples}
              onClick={onSampleClick}
              onDrop={onListDrop}
            />
          </div>
          <div className="col-1">
            <button className="btn btn-primary" onClick={moveAll} type="button">
              Move all
            </button>
          </div>
          <div className="col-9">
            <strong>Container wells</strong>
            <ContainerGrid
              containerType={libraryPrepBatch.containerType}
              cellGrid={cellGrid}
              movedSamples={movedSamples}
              onDrop={onGridDrop}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <button
              className="col-2 btn btn-primary float-right"
              onClick={gridSubmit}
              type="button"
            >
              Save changed well coordinates
            </button>
          </div>
        </div>
      </DndProvider>
    );
  }
}
