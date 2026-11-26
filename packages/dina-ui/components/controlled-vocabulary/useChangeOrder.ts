import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SaveArgs, useApiClient, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";

export type OrderItem = PersistedResource<ControlledVocabularyItem>;

/** PATCH only the items whose 1-based position changed. */
export function getPositionChanges(items: OrderItem[]): SaveArgs[] {
  return items
    .map((item, index) => ({ item, position: index + 1 }))
    .filter(({ item, position }) => item.position !== position)
    .map(({ item, position }) => ({
      type: "controlled-vocabulary-item",
      resource: { id: item.id, type: "controlled-vocabulary-item", position }
    }));
}

export interface UseChangeOrderParams {
  vocabularyId: string;
  apiBaseUrl: string;
  onSaved: () => void;
}

/** Loads every item of a vocabulary and holds its new order until saved. */
export function useChangeOrder({
  vocabularyId,
  apiBaseUrl,
  onSaved
}: UseChangeOrderParams) {
  const { save } = useApiClient();
  const [original, setOriginal] = useState<OrderItem[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  // The last moved or currently dragged item, highlighted in the list.
  const [activeId, setActiveId] = useState<string>();
  // The item being dragged, drawn in the drag overlay.
  const [draggingId, setDraggingId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const { loading } = useQuery<ControlledVocabularyItem[]>(
    {
      path: `${apiBaseUrl}/controlled-vocabulary-item`,
      filter: { "controlledVocabulary.uuid": { EQ: vocabularyId } },
      sort: "position",
      page: { limit: 1000 }
    },
    {
      onSuccess: ({ data }) => {
        setOriginal(data);
        setItems(data);
      }
    }
  );

  function moveItem(from: number, to: number) {
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) {
      return;
    }
    setActiveId(items[from].id);
    setItems(arrayMove(items, from, to));
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDraggingId(String(active.id));
  }

  function onDragCancel() {
    setDraggingId(undefined);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setDraggingId(undefined);
    if (over && active.id !== over.id) {
      const ids = items.map((item) => item.id);
      moveItem(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    }
  }

  function reset() {
    setItems(original);
    setActiveId(undefined);
  }

  async function saveOrder() {
    setSaving(true);
    setError(undefined);
    try {
      const changes = getPositionChanges(items);
      // One bulk request, so swapped positions don't trip the unique position constraint.
      if (changes.length) {
        await save(changes, { apiBaseUrl });
      }
      onSaved();
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return {
    items,
    loading,
    saving,
    error,
    activeId,
    draggingId,
    moveItem,
    onDragStart,
    onDragCancel,
    onDragEnd,
    reset,
    saveOrder
  };
}
