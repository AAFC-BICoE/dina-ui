import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import { MaterialSample } from "../../../../types/collection-api";
import RcTooltip from "rc-tooltip";

interface DraggableSampleBoxProps {
  onClick?: (e: any) => void;
  sample: MaterialSample;
  selected: boolean;
  wasMoved: boolean;
}

export const SAMPLE_BOX_DRAG_KEY = "materialSample";

export function DraggableSampleBox({
  onClick = noop,
  sample,
  selected,
  wasMoved
}: DraggableSampleBoxProps) {
  const [, drag] = useDrag({
    item: { sample, type: SAMPLE_BOX_DRAG_KEY }
  });

  return (
    <li className="list-group-item p-0" onClick={onClick} ref={drag}>
      <RcTooltip
        placement="top"
        overlay={<div style={{ maxWidth: "15rem" }}>{sample.id}</div>}
      >
        <div
          className="move-status-indicator list-group-item"
          style={{
            backgroundColor: selected
              ? "rgb(222, 252, 222)"
              : wasMoved
              ? "#fff3cd"
              : undefined,
            cursor: "move"
          }}
        >
          <span className="sample-box-text">{sample.id}</span>
        </div>
      </RcTooltip>
    </li>
  );
}