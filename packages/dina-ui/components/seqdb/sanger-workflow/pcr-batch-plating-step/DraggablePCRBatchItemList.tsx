import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";
import { useDrop } from "react-dnd-cjs";
import { DraggablePCRBatchItemBox, ITEM_BOX_DRAG_KEY } from "./DraggablePCRBatchItemBox";

interface DraggablePCRBatchItemListProps {
  availableItems: PcrBatchItem[];
  movedItems: PcrBatchItem[];
  onDrop: (item: PcrBatchItem) => void;
  selectedItems: PcrBatchItem[];
  onClick: (PcrBatchItem, e) => void;
}

export function DraggablePCRBatchItemList({
  availableItems,
  movedItems,
  selectedItems,
  onClick,
  onDrop
}: DraggablePCRBatchItemListProps) {
  //Double check this
  const [, dropRef] = useDrop({
    accept: ITEM_BOX_DRAG_KEY,
    drop: item => onDrop((item as any))
  });

  return (
    <ul
      className="list-group available-sample-list"
      ref={dropRef}
      style={{ minHeight: "400px", maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableItems.map(item => (
        <DraggablePCRBatchItemBox
          key={String(item?.id)}
          wasMoved={movedItems.includes(item)}
          pcrBatchItem={item}
          onClick={e => onClick(item, e)}
          selected={selectedItems.includes(item)}
        />
      ))}
    </ul>
  );
}
