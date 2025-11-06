import React, { useMemo, useEffect, useState, useRef } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CustomizableCardGrid } from "./CustomizableCardGrid";
import styles from "./CustomizableSectionGrid.module.css";
import { FaGripLinesVertical } from "react-icons/fa6";

interface SectionConfig {
  id: string;
  title: React.ReactNode;
  gridProps: {
    cards: any[];
    allCards: any[];
    onChange: (next: any[]) => void;
    isCustomizeMode: boolean;
  };
}
interface CustomizableSectionGridProps {
  sections: SectionConfig[];
  onSectionOrderChange: (nextOrder: SectionConfig[]) => void;
  isCustomizeMode: boolean;
}

export function CustomizableSectionGrid({
  sections,
  onSectionOrderChange,
  isCustomizeMode
}: CustomizableSectionGridProps) {
  // Keep only the order in state:
  const [order, setOrder] = useState<string[]>(() => sections.map(s => s.id));

  // Reconcile order whenever sections prop changes (add new, remove missing).
  useEffect(() => {
    const incomingIds = sections.map(s => s.id);
    setOrder(prev => {
      const kept = prev.filter(id => incomingIds.includes(id));
      const missing = incomingIds.filter(id => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [sections]);

  // Always derive the sections to render from the latest props:
  const orderedSections = useMemo(
    () => order.map(id => sections.find(s => s.id === id)).filter(Boolean) as SectionConfig[],
    [order, sections]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder(prev => {
      const from = prev.indexOf(String(active.id));
      const to = prev.indexOf(String(over.id));
      const next = arrayMove(prev, from, to);
      // Report the new order using the latest section objects:
      onSectionOrderChange(next.map(id => sections.find(s => s.id === id)!).filter(Boolean));
      return next;
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedSections.map(s => s.id)} strategy={rectSortingStrategy}>
        {orderedSections.map(section => (
          <SortableSection key={section.id} section={section} isCustomizeMode={isCustomizeMode} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableSection({
  section,
  isCustomizeMode
}: {
  section: SectionConfig;
  isCustomizeMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  // We’ll measure the header height to nudge the handle down so it aligns
  // visually with the first row of cards (below the title).
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [handleOffsetTop, setHandleOffsetTop] = useState<number>(0);

  useEffect(() => {
    if (headerRef.current) {
      setHandleOffsetTop(headerRef.current.offsetHeight || 0);
    }
  }, [section.title, isCustomizeMode]);

  // Visual states for the whole section when hovering only the handle.
  const [handleHover, setHandleHover] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const { cards } = section.gridProps;

  // Hide section when not customizing AND there are no cards (existing behavior)
  if (!isCustomizeMode && cards.length === 0) return null;

  // Build the className set for the container based on mode and states:
  const containerClass = [
    styles.sectionShell,
    isCustomizeMode ? styles.withRail : styles.noRail,
    isDragging ? styles.isDragging : "",
    handleHover ? styles.isHovering : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={setNodeRef} className={containerClass} style={style}>
      {isCustomizeMode && (
        <aside
          className={styles.sectionHandleRail}
          style={{ paddingTop: handleOffsetTop ? `${handleOffsetTop}px` : undefined }}
        >
          <button
            type="button"
            className={styles.dragHandleButton}
            aria-label="Drag section"
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            onMouseEnter={() => setHandleHover(true)}
            onMouseLeave={() => setHandleHover(false)}
          >
            <FaGripLinesVertical aria-hidden="true" />
          </button>
        </aside>
      )}

      <div className={styles.sectionInner}>
        <div ref={headerRef} className={styles.sectionHeaderRow}>
          <h3 className="h5 m-0">{section.title}</h3>
        </div>
        <CustomizableCardGrid {...section.gridProps} />
      </div>
    </section>
  );
}


