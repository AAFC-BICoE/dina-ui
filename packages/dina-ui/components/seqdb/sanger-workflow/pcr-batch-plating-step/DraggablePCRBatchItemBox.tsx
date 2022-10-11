import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import { MaterialSample } from "../../../../types/collection-api";
import RcTooltip from "rc-tooltip";
import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";

interface DraggablePCRBatchItemBoxProps {
  onClick?: (e: any) => void;
  pcrBatchItem: PcrBatchItem;
  selected: boolean;
  wasMoved: boolean;
}

export const SAMPLE_BOX_DRAG_KEY = "materialSample";

export function DraggablePCRBatchItemBox({
  onClick = noop,
  pcrBatchItem,
  selected,
  wasMoved
}: DraggablePCRBatchItemBoxProps) {
  const [, drag] = useDrag({
    item: {   pcrBatchItem, type: SAMPLE_BOX_DRAG_KEY }
  });

  return (
    <li className="list-group-item p-0" onClick={onClick} ref={drag}>
      <RcTooltip
        placement="top"
        overlay={<div style={{ maxWidth: "15rem" }}>{pcrBatchItem.id}</div>}
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
          <span className="sample-box-text">{pcrBatchItem.id}</span>
        </div>
      </RcTooltip>
    </li>
  );
}