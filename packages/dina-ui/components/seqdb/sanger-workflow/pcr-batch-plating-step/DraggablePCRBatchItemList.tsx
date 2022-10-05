import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";
import { useDrop } from "react-dnd-cjs";
import { MaterialSample } from "../../../../types/collection-api";
import { DraggableSampleBox, SAMPLE_BOX_DRAG_KEY } from "./DraggablePCRBatchItemBox";

interface DraggableSampleListProps {
  availableItems: PcrBatchItem[];
  movedItems: PcrBatchItem[];
  onDrop: (item: PcrBatchItem) => void;
  selectedItems: PcrBatchItem[];
  onClick: (PcrBatchItem, e) => void;
}

export function DraggableSampleList({
  availableItems,
  movedItems,
  selectedItems,
  onClick,
  onDrop
}: DraggableSampleListProps) {
  const [, dropRef] = useDrop({
    accept: SAMPLE_BOX_DRAG_KEY,
    drop: item => onDrop((item as any).sample)
  });

  return (
    <ul
      className="list-group available-sample-list"
      ref={dropRef}
      style={{ minHeight: "400px", maxHeight: "400px", overflowY: "scroll" }}
    >
      {availableItems.map(item => (
        <DraggableSampleBox
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
