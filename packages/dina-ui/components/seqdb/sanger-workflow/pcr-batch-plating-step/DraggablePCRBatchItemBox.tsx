import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import RcTooltip from "rc-tooltip";
import { PcrBatchItemSample } from "./usePCRBatchItemGridControls";

interface DraggablePCRBatchItemBoxProps {
  onClick?: (e: any) => void;
  pcrBatchItemSample: PcrBatchItemSample;
  selected: boolean;
  wasMoved: boolean;
}

export const ITEM_BOX_DRAG_KEY = "materialSampleItem";

export function DraggablePCRBatchItemBox({
  onClick = noop,
  pcrBatchItemSample,
  selected,
  wasMoved
}: DraggablePCRBatchItemBoxProps) {
  const [, drag] = useDrag({
    item: { pcrBatchItemSample, type: ITEM_BOX_DRAG_KEY }
  });

  return (
    <li className="list-group-item p-0" onClick={onClick} ref={drag}>
      <RcTooltip
        placement="top"
        overlay={<div style={{ maxWidth: "15rem" }}>{pcrBatchItemSample.sampleName}</div>}
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
          <span className="sample-box-text">{pcrBatchItemSample.sampleName}</span>
        </div>
      </RcTooltip>
    </li>
  );
}