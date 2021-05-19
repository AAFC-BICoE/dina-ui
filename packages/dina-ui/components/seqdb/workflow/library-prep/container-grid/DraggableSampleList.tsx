import { useDrop } from "react-dnd-cjs";
import { MolecularSample } from "../../../../../types/seqdb-api";
import { DraggableSampleBox, SAMPLE_BOX_DRAG_KEY } from "./DraggableSampleBox";

interface DraggableSampleListProps {
  availableSamples: MolecularSample[];
  movedSamples: MolecularSample[];
  onDrop: (item: MolecularSample) => void;
  selectedSamples: MolecularSample[];
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
