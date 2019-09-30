import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import ReactTooltip from "react-tooltip";
import { Sample } from "../../../../types/seqdb-api";

interface DraggableSampleBoxProps {
  onClick?: (e: any) => void;
  sample: Sample;
  selected: boolean;
  wasMoved: boolean;
}

export function DraggableSampleBox({
  onClick = noop,
  sample,
  selected,
  wasMoved
}: DraggableSampleBoxProps) {
  const [, drag] = useDrag({
    item: { sample, type: "sample" }
  });

  return (
    <li
      className="list-group-item"
      data-tip={true}
      data-for={sample.id}
      onClick={onClick}
      ref={drag}
      style={{
        backgroundColor: selected
          ? "rgb(222, 252, 222)"
          : wasMoved
          ? "#fff3cd"
          : undefined,
        cursor: "move"
      }}
    >
      <ReactTooltip id={sample.id}>
        <span>{sample.name}</span>
      </ReactTooltip>
      {sample.name}
    </li>
  );
}
