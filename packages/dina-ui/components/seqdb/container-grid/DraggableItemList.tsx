import { useDrop } from "react-dnd";
import { DraggableItemBox, ITEM_BOX_DRAG_KEY } from "./DraggableItemBox";

interface DraggableItemListProps<ItemType> {
  availableItems: ItemType[];
  movedItems: ItemType[];
  onDrop: (item: { batchItemSample: ItemType }) => void;
  selectedItems: ItemType[];
  onClick: (batchItem, e) => void;
  editMode: boolean;
}

export function DraggableItemList<
  ItemType extends { sampleName?: string; sampleId?: string }
>({
  availableItems,
  movedItems,
  selectedItems,
  onClick,
  onDrop,
  editMode
}: DraggableItemListProps<ItemType>) {
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
      ref={dropRef as any}
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
      {availableItems.map((item, index) => (
        <DraggableItemBox<ItemType>
          key={index}
          wasMoved={movedItems.includes(item)}
          batchItemSample={item}
          onClick={(e) => onClick(item, e)}
          selected={selectedItems.includes(item)}
          editMode={editMode}
          coordinates={null}
        />
      ))}
    </ul>
  );
}
