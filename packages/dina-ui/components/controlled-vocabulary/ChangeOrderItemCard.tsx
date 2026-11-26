import { getPreferredMultilingualPair } from "common-ui";
import { HTMLAttributes } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { LuGripVertical } from "react-icons/lu";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import styles from "../../pages/controlled-vocabulary/controlled-vocabulary.module.css";
import { OrderItem } from "./useChangeOrder";

export interface ChangeOrderItemCardProps {
  item: OrderItem;
  index: number;
  count: number;
  active: boolean;
  handleProps?: HTMLAttributes<HTMLElement>;
  onMove?: (to: number) => void;
}

/** One item of the Change Order list, also drawn as the drag overlay. */
export function ChangeOrderItemCard({
  item,
  index,
  count,
  active,
  handleProps,
  onMove
}: ChangeOrderItemCardProps) {
  const { formatMessage, locale } = useDinaIntl();

  const name =
    getPreferredMultilingualPair(
      item.multilingualTitle?.titles,
      "title",
      locale
    )?.title || item.name;

  const description = getPreferredMultilingualPair(
    item.multilingualDescription?.descriptions,
    "desc",
    locale
  )?.desc;

  return (
    <div
      className={`${styles.orderRow} ${active ? styles.orderRowActive : ""}`}
    >
      <span
        {...handleProps}
        className={styles.orderGrip}
        aria-label={formatMessage("dragToReorder")}
        title={formatMessage("dragToReorder")}
      >
        <LuGripVertical />
      </span>
      <span className={styles.orderBadge}>{index + 1}</span>
      <div className={styles.orderText}>
        <div className="fw-bold">{name}</div>
        <div className={styles.orderDescription}>
          {description || formatMessage("noDescription")}
        </div>
      </div>
      <button
        type="button"
        className={styles.orderMoveButton}
        onClick={() => onMove?.(index - 1)}
        disabled={index === 0}
        aria-label={formatMessage("moveItemUp", { name })}
      >
        <FaChevronUp />
      </button>
      <button
        type="button"
        className={styles.orderMoveButton}
        onClick={() => onMove?.(index + 1)}
        disabled={index === count - 1}
        aria-label={formatMessage("moveItemDown", { name })}
      >
        <FaChevronDown />
      </button>
    </div>
  );
}
