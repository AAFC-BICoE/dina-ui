import { useDrop } from "react-dnd-cjs";
import {
  DraggablePCRBatchItemBox,
  ITEM_BOX_DRAG_KEY
} from "./DraggablePCRBatchItemBox";
import { PcrBatchItemSample } from "./usePCRBatchItemGridControls";

interface DraggablePCRBatchItemListProps {
  availableItems: PcrBatchItemSample[];
  movedItems: PcrBatchItemSample[];
  onDrop: (item: { pcrBatchItemSample: PcrBatchItemSample }) => void;
  selectedItems: PcrBatchItemSample[];
  onClick: (PcrBatchItem, e) => void;
  editMode: boolean;
}

export function DraggablePCRBatchItemList({
  availableItems,
  movedItems,
  selectedItems,
  onClick,
  onDrop,
  editMode
}: DraggablePCRBatchItemListProps) {
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
        <DraggablePCRBatchItemBox
          key={String(item?.sampleId)}
          wasMoved={movedItems.includes(item)}
          pcrBatchItemSample={item}
          onClick={(e) => onClick(item, e)}
          selected={selectedItems.includes(item)}
          editMode={editMode}
          coordinates={null}
        />
      ))}
    </ul>
  );
}
