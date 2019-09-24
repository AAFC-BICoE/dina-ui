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
    fillMode,
    gridSubmit,
    loading,
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
          <div className="col-12">
            <ul className="list-inline">
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
          </div>
        </div>
        <div className="row">
          <div className="col-3">
            <DraggableSampleList
              availableSamples={availableSamples}
              selectedSamples={selectedSamples}
              movedSamples={movedSamples}
              onClick={onSampleClick}
              onDrop={onListDrop}
            />
          </div>
          <div className="col-9">
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
              Save
            </button>
          </div>
        </div>
      </DndProvider>
    );
  }
}
