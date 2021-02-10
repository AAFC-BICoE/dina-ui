import { useDrop } from "react-dnd-cjs";
import { MolecularSample } from "../../../../../types/seqdb-api";
import { DraggableSampleBox } from "./DraggableSampleBox";

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
    accept: "molecularSample",
    drop: item => onDrop((item as any).sample)
  });

  return (
    <ul
      className="list-group available-sample-list"
      ref={dropRef}
      style={{ minHeight: "400px", maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableSamples &&
        availableSamples.length > 0 &&
        availableSamples.map(sample => (
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
