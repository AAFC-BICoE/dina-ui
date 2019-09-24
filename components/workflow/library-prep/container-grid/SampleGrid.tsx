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

export function SampleLocationGrid(props: ContainerGridProps) {
  const { libraryPrepBatch } = props;

  const {
    availableSamples,
    cellGrid,
    gridSubmit,
    libraryPrepsLoading,
    movedSamples,
    onGridDrop,
    onListDrop,
    onSampleClick,
    samplesLoading,
    selectedSamples
  } = useSampleGridControls(props);

  if (samplesLoading || libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  } else {
    return (
      <DndProvider backend={HTML5Backend}>
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
          <div className="col-8">
            <ContainerGrid
              containerType={libraryPrepBatch.containerType}
              cellGrid={cellGrid}
              movedSamples={movedSamples}
              onDrop={onGridDrop}
            />
          </div>
          <div className="col-1">
            <button
              className="btn btn-primary"
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
