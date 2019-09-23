import { useDrop } from "react-dnd-cjs";
import { Sample } from "../../../../types/seqdb-api";
import { DraggableSampleBox } from "./DraggableSampleBox";

interface DraggableSampleListProps {
  availableSamples: Sample[];
  movedSamples: Sample[];
  onDrop: (item: Sample) => void;
  selectedSamples: Sample[];
  onClick: (sample, e) => void;
}

export function DraggableSampleList({
  availableSamples,
  movedSamples,
  selectedSamples,
  onClick,
  onDrop
}: DraggableSampleListProps) {
  const [, dropRef] = useDrop({
    accept: "sample",
    drop: item => onDrop((item as any).sample)
  });

  return (
    <ul
      className="list-group"
      ref={dropRef}
      style={{ maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableSamples.map(sample => (
        <DraggableSampleBox
          key={sample.id}
          wasMoved={movedSamples.includes(sample)}
          sample={sample}
          onClick={e => onClick(sample, e)}
          selected={selectedSamples.includes(sample)}
        />
      ))}
    </ul>
  );
}
