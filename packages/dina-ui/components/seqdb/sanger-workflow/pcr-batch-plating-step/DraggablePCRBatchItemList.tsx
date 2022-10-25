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
  const [, dropRef] = useDrop({
    accept: ITEM_BOX_DRAG_KEY,
    drop: (item) => {
      if (editMode) {
        onDrop(item as any);
      }
    }
  });

  return (
    <ul
      className="list-group available-sample-list"
      ref={dropRef}
      style={{ minHeight: "400px", maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableItems.map((item) => (
        <DraggablePCRBatchItemBox
          key={String(item?.sampleId)}
          wasMoved={movedItems.includes(item)}
          pcrBatchItemSample={item}
          onClick={(e) => onClick(item, e)}
          selected={selectedItems.includes(item)}
          editMode={editMode}
        />
      ))}
    </ul>
  );
}
