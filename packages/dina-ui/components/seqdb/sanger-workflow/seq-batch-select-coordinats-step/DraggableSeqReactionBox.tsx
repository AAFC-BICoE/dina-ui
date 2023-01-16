import { noop } from "lodash";
import { useDrag } from "react-dnd-cjs";
import RcTooltip from "rc-tooltip";
import { SeqReactionSample } from "./useSeqSelectCoordinatesControls";

interface DraggableSeqReactionBoxProps {
  onClick?: (e: any) => void;
  seqReactionSample: SeqReactionSample;
  coordinates: string | null;
  selected: boolean;
  wasMoved: boolean;
  editMode: boolean;
}

export const ITEM_BOX_DRAG_KEY = "seqReactionMaterialSampleItem";

export function DraggableSeqReactionBox({
  onClick = noop,
  seqReactionSample,
  coordinates,
  selected,
  wasMoved,
  editMode
}: DraggableSeqReactionBoxProps) {
  const [, drag] = useDrag({
    item: { seqReactionSample, type: ITEM_BOX_DRAG_KEY },
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
        trigger={coordinates ? "hover" : ""}
        overlay={
          <>
            {coordinates && (
              <div style={{ maxWidth: "15rem" }}>
                <>
                  {coordinates}
                  <br />
                  {seqReactionSample.sampleName}
                </>
              </div>
            )}
          </>
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
            {seqReactionSample.sampleName}
          </span>
        </div>
      </RcTooltip>
    </li>
  );
}
