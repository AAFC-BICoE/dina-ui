import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { LoadingSpinner } from "common-ui";
import { Modal } from "react-bootstrap";
import { createPortal } from "react-dom";
import { FaFloppyDisk } from "react-icons/fa6";
import { DinaMessage } from "../../intl/dina-ui-intl";
import styles from "../../pages/controlled-vocabulary/controlled-vocabulary.module.css";
import { ChangeOrderItemCard } from "./ChangeOrderItemCard";
import { ChangeOrderItemRow } from "./ChangeOrderItemRow";
import { useChangeOrder } from "./useChangeOrder";

export interface ChangeOrderModalProps {
  vocabularyId: string;
  vocabularyName: string;
  apiBaseUrl: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ChangeOrderModal({
  vocabularyId,
  vocabularyName,
  apiBaseUrl,
  onClose,
  onSaved
}: ChangeOrderModalProps) {
  const {
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
  } = useChangeOrder({
    vocabularyId,
    apiBaseUrl,
    onSaved: () => {
      onSaved();
      onClose();
    }
  });

  const draggingIndex = items.findIndex((item) => item.id === draggingId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <Modal
      show={true}
      onHide={onClose}
      dialogClassName={styles.orderDialog}
      contentClassName={styles.orderContent}
    >
      {/* Title */}
      <Modal.Header closeButton={true}>
        <div>
          <Modal.Title as="h2" className="fs-5 fw-bold my-0">
            <DinaMessage id="changeOrder" />
          </Modal.Title>
          <div className="small text-muted">
            {vocabularyName} ·{" "}
            <DinaMessage id="itemCount" values={{ count: items.length }} />
          </div>
        </div>
      </Modal.Header>

      {/* Order List */}
      <Modal.Body>
        <p className="small text-muted">
          <DinaMessage id="changeOrderInstructions" />
        </p>
        {loading ? (
          <LoadingSpinner loading={true} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className={styles.orderList}>
                {items.map((item, index) => (
                  <ChangeOrderItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    count={items.length}
                    active={item.id === activeId}
                    onMove={(to) => moveItem(index, to)}
                  />
                ))}
              </ol>
            </SortableContext>

            {/* Using a portal to render the drag overlay to the body so it doesn't clip outside the panel. */}
            {createPortal(
              <DragOverlay zIndex={2000}>
                {draggingIndex >= 0 && (
                  <ChangeOrderItemCard
                    item={items[draggingIndex]}
                    index={draggingIndex}
                    count={items.length}
                    active={true}
                  />
                )}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        )}
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
      </Modal.Body>

      {/* Action Buttons */}
      <Modal.Footer>
        <button
          type="button"
          className={`btn btn-link me-auto ${styles.orderResetButton}`}
          onClick={reset}
          disabled={saving}
        >
          <DinaMessage id="resetToOriginalOrder" />
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          <DinaMessage id="cancelButtonText" />
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={saveOrder}
          disabled={saving || loading}
        >
          <FaFloppyDisk className="me-2" />
          <DinaMessage id="saveOrder" />
        </button>
      </Modal.Footer>
    </Modal>
  );
}
