import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import RcTooltip from "rc-tooltip";
import { PcrBatchItemSample } from "./usePCRBatchItemGridControls";

interface DraggablePCRBatchItemBoxProps {
  onClick?: (e: any) => void;
  pcrBatchItemSample: PcrBatchItemSample;
  selected: boolean;
  wasMoved: boolean;
  editMode: boolean;
}

export const ITEM_BOX_DRAG_KEY = "materialSampleItem";

export function DraggablePCRBatchItemBox({
  onClick = noop,
  pcrBatchItemSample,
  selected,
  wasMoved,
  editMode
}: DraggablePCRBatchItemBoxProps) {
  const [, drag] = useDrag({
    item: { pcrBatchItemSample, type: ITEM_BOX_DRAG_KEY },
    canDrag: () => {
      return editMode;
    }
  });

  const backgroundColor = () => {
    if (editMode) {
      if (selected) {
        return "#defcde";
      }
      if (wasMoved) {
        return "#fff3cd";
      }
    }

    return undefined;
  };

  return (
    <li className="list-group-item p-0" onClick={onClick} ref={drag}>
      <RcTooltip
        placement="top"
        overlay={
          <div style={{ maxWidth: "15rem" }}>
            {pcrBatchItemSample.sampleName}
            <>
              {pcrBatchItemSample.wellColumn ? (
                <>
                  <br />
                  Coordinates: {pcrBatchItemSample.wellColumn}
                  {pcrBatchItemSample.wellRow}
                </>
              ) : (
                <>
                  <br />
                  Not placed in container.
                </>
              )}
            </>
          </div>
        }
      >
        <div
          className="move-status-indicator list-group-item"
          style={{
            backgroundColor: backgroundColor(),
            cursor: editMode ? "move" : "default"
          }}
        >
          <span className="sample-box-text">
            {pcrBatchItemSample.sampleName}
          </span>
        </div>
      </RcTooltip>
    </li>
  );
}
