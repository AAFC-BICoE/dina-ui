import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NavigationCard } from "../../types/common";
import { NavigationCardComponent } from "./NavigationCard";
import { Button } from "react-bootstrap";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import styles from "./NavigationCard.module.css";

interface CustomizableCardGridProps {
  initialCards: NavigationCard[];
}

export function CustomizableCardGrid({ initialCards }: CustomizableCardGridProps) {
  const [gridCards, setGridCards] = useState<NavigationCard[]>(initialCards);
  const [availableCards, setAvailableCards] = useState<NavigationCard[]>([]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = gridCards.findIndex((c) => c.id === active.id);
    const newIndex = gridCards.findIndex((c) => c.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setGridCards((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  function removeCard(cardId: string) {
    const card = gridCards.find((c) => c.id === cardId);
    if (card) {
      setGridCards((prev) => prev.filter((c) => c.id !== cardId));
      setAvailableCards((prev) => [...prev, card]);
    }
  }

  function addCard(card: NavigationCard) {
    setGridCards((prev) => [...prev, card]);
    setAvailableCards((prev) => prev.filter((c) => c.id !== card.id));
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={gridCards.map((card) => card.id)}
        strategy={rectSortingStrategy}
      >
        <div className="d-flex flex-wrap gap-3">
          {gridCards.map((card) => (
            <SortableCard key={card.id} card={card} onRemove={() => removeCard(card.id)} />
          ))}

          {/* Add placeholders for adding cards */}
          {availableCards.length > 0 && (
            <AddCardPlaceholder availableCards={availableCards} onAdd={addCard} />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({ card, onRemove }: { card: NavigationCard; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
    opacity: isDragging ? 0.5 : 1,
    width: "180px",
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Remove button */}
        <Button
        variant="outline-dark"
        size="sm"
        style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 10,
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            lineHeight: "1",
        }}
        onClick={(e) => {
            e.stopPropagation();
            onRemove();
        }}
        >
        ×
        </Button>

      {/* Drag handle */}
      <div
        {...listeners}
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          cursor: "grab",
          zIndex: 10,
          background: "#eee",
          borderRadius: "4px",
          padding: "2px 6px",
          fontSize: "12px",
        }}
      >
        ☰
      </div>

      <NavigationCardComponent card={card} />
    </div>
  );
}



function AddCardPlaceholder({
  availableCards,
  onAdd,
}: {
  availableCards: NavigationCard[];
  onAdd: (card: NavigationCard) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className={styles.placeholderCard}>
      <Button
        variant="outline-primary"
        size="sm"
        className={styles.addButton}
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        +
      </Button>

      {showDropdown && (
        <div className={styles.dropdownMenuCustom}>
          {availableCards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                onAdd(card);
                setShowDropdown(false);
              }}
            >
              <card.icon size={18} style={{ color: "#1976d2" }} />
              <span>
                <DinaMessage id={card.title as any} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
