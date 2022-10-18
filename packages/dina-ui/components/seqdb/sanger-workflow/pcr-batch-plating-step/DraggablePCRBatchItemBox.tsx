import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import RcTooltip from "rc-tooltip";
import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";

interface DraggablePCRBatchItemBoxProps {
  onClick?: (e: any) => void;
  materialSampleItem: PcrBatchItem;
  selected: boolean;
  wasMoved: boolean;
}

export const ITEM_BOX_DRAG_KEY = "materialSampleItem";

export function DraggablePCRBatchItemBox({
  onClick = noop,
  materialSampleItem,
  selected,
  wasMoved
}: DraggablePCRBatchItemBoxProps) {
  const [, drag] = useDrag({
    item: { materialSampleItem, type: ITEM_BOX_DRAG_KEY }
  });

  return (
    <li className="list-group-item p-0" onClick={onClick} ref={drag}>
      <RcTooltip
        placement="top"
        overlay={<div style={{ maxWidth: "15rem" }}>{materialSampleItem.id}</div>}
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
          <span className="sample-box-text">{materialSampleItem.id}</span>
        </div>
      </RcTooltip>
    </li>
  );
}