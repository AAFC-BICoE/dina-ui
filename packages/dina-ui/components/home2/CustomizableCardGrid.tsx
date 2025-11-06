import React, { useState, useEffect, useMemo, useRef} from "react";
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
import { DinaMessage } from "../../intl/dina-ui-intl";
import styles from "./NavigationCard.module.css";
import { FaGripLines, FaRegCircleXmark } from "react-icons/fa6";
import cx from "clsx";

interface CustomizableCardGridProps {
  cards: NavigationCard[];
  allCards: NavigationCard[];
  onChange: (gridCards: NavigationCard[]) => void;
  isCustomizeMode: boolean;
}

export function CustomizableCardGrid({ 
  cards, 
  allCards, 
  onChange, 
  isCustomizeMode 
}: CustomizableCardGridProps & { isCustomizeMode: boolean }) {
  const [gridCards, setGridCards] = useState<NavigationCard[]>(cards);

  // Track the previous mode to detect changes
  const prevModeRef = useRef(isCustomizeMode);

  // Seed draft only when entering customize mode (isCustomize false -> true)


  useEffect(() => {
    // Always set grid cards when customize mode changes
        setGridCards(cards);
    prevModeRef.current = isCustomizeMode;
  }, [isCustomizeMode, cards]);


  // Derived: cards available to add = allCards - gridCards
  const availableCards = useMemo(() => {
    const selected = new Set(gridCards.map(c => c.id));
    return allCards.filter(c => !selected.has(c.id));
  }, [allCards, gridCards]);

  if (!isCustomizeMode) {
    return (
      <div className="d-flex flex-wrap gap-3">
        {cards.map(card => (
          <div key={card.id} style={{ width: 180 }}>
            <NavigationCardComponent card={card} />
          </div>
        ))}
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGridCards(prev => {
      const from = prev.findIndex(c => c.id === active.id);
      const to   = prev.findIndex(c => c.id === over.id);
      if (from === -1 || to === -1) return prev;
      const next = arrayMove(prev, from, to);
      onChange(next);
      return next;
    });
  }

  function removeCard(id: string) {
    setGridCards(prev => {
      const next = prev.filter(c => c.id !== id);
      onChange(next);
      return next;
    });
  }

  function addCard(card: NavigationCard) {
    setGridCards(prev => {
      if (prev.some(c => c.id === card.id)) return prev;
      const next = [...prev, card];
      onChange(next);
      return next;
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={gridCards.map(card => card.id)} strategy={rectSortingStrategy}>
        <div className="d-flex flex-wrap gap-3">
          {gridCards.map(card => (
            <SortableCard
              key={card.id}
              card={card}
              onRemove={() => removeCard(card.id)}
              isCustomizeMode
            />
          ))}

          {availableCards.length > 0 && (
            <AddCardPlaceholder availableCards={availableCards} onAdd={addCard} />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}


type Props = {
  card: NavigationCard;
  onRemove: () => void;
  isCustomizeMode: boolean;
};

export default function SortableCard({ card, onRemove, isCustomizeMode }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  // dnd-kit dynamic transform/transition must remain inline:
  const transformStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const containerClass = cx(
    styles.sortableCard, 
    isDragging && styles.dragging,
    isCustomizeMode && styles.customizing
  );

  return (
    <div ref={setNodeRef} className={containerClass} style={transformStyle}>
      {isCustomizeMode && (
        <div className={styles.overlayControls}>
          {/* Drag handle (activator) */}
          <div
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            className={styles.draggableCard}
            role="button"
            aria-label="Drag card"
            title="Drag card"
          >
            <FaGripLines aria-hidden="true" className={styles.cardGripIcon} />
          </div>

          {/* Remove button */}
          <Button
            variant="link"
            size="sm"
            className={styles.cardRemoveButton}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove card"
            title="Remove card"
          >
            <FaRegCircleXmark className={styles.removeIcon} />
          </Button>
        </div>
      )}

      <div className={styles.cardBodyWrapper}>
        <NavigationCardComponent card={card} />
      </div>
    </div>
  );
}


function AddCardPlaceholder({
  availableCards,
  onAdd
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
