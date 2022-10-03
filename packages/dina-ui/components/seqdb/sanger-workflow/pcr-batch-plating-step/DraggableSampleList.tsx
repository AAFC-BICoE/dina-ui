import { useDrop } from "react-dnd-cjs";
import { MaterialSample } from "../../../../types/collection-api";
import { DraggableSampleBox, SAMPLE_BOX_DRAG_KEY } from "./DraggableSampleBox";

interface DraggableSampleListProps {
  availableSamples: MaterialSample[];
  movedSamples: MaterialSample[];
  onDrop: (item: MaterialSample) => void;
  selectedSamples: MaterialSample[];
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
    accept: SAMPLE_BOX_DRAG_KEY,
    drop: item => onDrop((item as any).sample)
  });

  return (
    <ul
      className="list-group available-sample-list"
      ref={dropRef}
      style={{ minHeight: "400px", maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableSamples.map(sample => (
        <DraggableSampleBox
          key={String(sample?.id)}
          wasMoved={movedSamples.includes(sample)}
          sample={sample}
          onClick={e => onClick(sample, e)}
          selected={selectedSamples.includes(sample)}
        />
      ))}
    </ul>
  );
}
