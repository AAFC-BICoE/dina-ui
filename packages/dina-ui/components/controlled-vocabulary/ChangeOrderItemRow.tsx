import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChangeOrderItemCard,
  ChangeOrderItemCardProps
} from "./ChangeOrderItemCard";

export type ChangeOrderItemRowProps = Omit<
  ChangeOrderItemCardProps,
  "handleProps"
>;

/** Sortable list entry - while dragged it stays as a faded placeholder under the overlay. */
export function ChangeOrderItemRow(props: ChangeOrderItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined
      }}
    >
      <ChangeOrderItemCard
        {...props}
        handleProps={{ ...attributes, ...listeners }}
      />
    </li>
  );
}
