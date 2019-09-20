import { DraggableSampleBox } from "./DraggableSampleBox";

export function DraggableSampleList({
  availableSamples,
  selectedSamples,
  onClick = (sample, e) => undefined
}) {
  return (
    <ul
      className="list-group"
      style={{ maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableSamples.map(sample => (
        <DraggableSampleBox
          key={sample.id}
          sample={sample}
          onClick={e => onClick(sample, e)}
          selected={selectedSamples.includes(sample)}
        />
      ))}
    </ul>
  );
}
