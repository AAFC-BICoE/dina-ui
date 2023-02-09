import { useDrop } from "react-dnd-cjs";
import {
  DraggableSeqReactionBox,
  ITEM_BOX_DRAG_KEY
} from "./DraggableSeqReactionBox";
import { SeqReactionSample } from "./useSeqSelectCoordinatesControls";

interface DraggableSeqReactionListProps {
  availableItems: SeqReactionSample[];
  movedItems: SeqReactionSample[];
  onDrop: (item: { seqReactionSample: SeqReactionSample }) => void;
  selectedItems: SeqReactionSample[];
  onClick: (PcrBatchItem, e) => void;
  editMode: boolean;
}

export function DraggableSeqReactionList({
  availableItems,
  movedItems,
  selectedItems,
  onClick,
  onDrop,
  editMode
}: DraggableSeqReactionListProps) {
  const [{ dragHover, dragging }, dropRef] = useDrop({
    accept: ITEM_BOX_DRAG_KEY,
    drop: (item) => {
      if (editMode) {
        onDrop(item as any);
      }
    },
    collect: (monitor) => ({
      dragHover: monitor.isOver(),
      dragging: monitor.canDrop()
    })
  });

  return (
    <ul
      className="list-group available-sample-list"
      ref={dropRef}
      style={{
        minHeight: "400px",
        maxHeight: "400px",
        overflowY: "scroll",
        border: dragHover
          ? "3px dashed #1C6EA4"
          : dragging
          ? "3px dashed #78909c"
          : undefined,
        background: dragHover ? "#f7fbff" : dragging ? "#f2f2f2" : undefined
      }}
    >
      {availableItems.map((item) => (
        <DraggableSeqReactionBox
          key={String(item?.sampleId)}
          wasMoved={movedItems.includes(item)}
          seqReactionSample={item}
          onClick={(e) => onClick(item, e)}
          selected={selectedItems.includes(item)}
          editMode={editMode}
          coordinates={null}
        />
      ))}
    </ul>
  );
}
