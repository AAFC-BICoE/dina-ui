import { useMemo, useRef, useState } from "react";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import { LoadingSpinner, useQuery } from "../../..";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../../../types/seqdb-api";
import { ContainerGrid } from "./ContainerGrid";
import { DraggableSampleList } from "./DraggableSampleList";

interface ContainerGridProps {
  chain: Chain;
  sampleSelectionStep: ChainStepTemplate;
}

export function SampleLocationGrid({
  chain,
  sampleSelectionStep
}: ContainerGridProps) {
  const { loading: sampleSrLoading, response: sampleSrResponse } = useQuery<
    StepResource[]
  >({
    filter: {
      "chain.chainId": chain.id,
      "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id
    },
    include: "sample",
    page: { limit: 1000 },
    path: "stepResource"
  });

  const availableSampleList = useMemo(() => {
    if (sampleSrResponse) {
      return sampleSrResponse.data.map(sr => sr.sample);
    } else {
      return [];
    }
  }, [sampleSrResponse]);

  const mockContainer = {
    containerType: { numberOfColumns: 12, numberOfRows: 8 }
  };

  const [locations, setLocations] = useState<{ [key: string]: Sample }>({});
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const lastSelectedSampleRef = useRef<Sample>();

  if (sampleSrLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (sampleSrResponse) {
    function onGridDrop(sample, coords) {
      // Remove the sample from the sample list:
      if (availableSampleList.includes(sample)) {
        availableSampleList.splice(availableSampleList.indexOf(sample), 1);
      }

      // Remove the sample from the grid.
      for (const attr in locations) {
        if (locations[attr] === sample) {
          setLocations(locs => ({ ...locs, [attr]: undefined }));
        }
      }

      // Add the sample to the grid state.
      setLocations(locs => ({ ...locs, [coords]: sample }));
    }

    function onSampleClick(sample, e) {
      if (lastSelectedSampleRef.current && e.shiftKey) {
        const currentIndex = availableSampleList.indexOf(sample);
        const lastIndex = availableSampleList.indexOf(
          lastSelectedSampleRef.current
        );

        const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
          (a, b) => a - b
        );

        const newSelectedSamples = availableSampleList.slice(
          lowIndex,
          highIndex + 1
        );

        setSelectedSamples(newSelectedSamples);
      } else {
        setSelectedSamples([sample]);
      }

      lastSelectedSampleRef.current = sample;
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="row">
          <div className="col-3">
            <DraggableSampleList
              availableSamples={availableSampleList}
              selectedSamples={selectedSamples}
              onClick={onSampleClick}
            />
          </div>
          <div className="col-9">
            <ContainerGrid
              container={mockContainer}
              locations={locations}
              onDrop={onGridDrop}
            />
          </div>
        </div>
      </DndProvider>
    );
  }
}
