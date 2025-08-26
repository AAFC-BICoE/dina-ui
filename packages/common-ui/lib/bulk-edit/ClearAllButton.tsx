import { FaEraser, FaUndo } from "react-icons/fa";
import { Tooltip } from "../tooltip/Tooltip";
import { useBulkEditTabContext } from "./bulk-context";
import { useIntl } from "react-intl";

export interface ClearAllButtonProps {
  /** Field’s full Formik path, e.g. "dwcDecimalLatitude". */
  fieldName: string;

  /** Called after the field is blanked; usually `setValue("")`. */
  onClearLocal: () => void;

  /** Shows undo if true (already cleared), shows clear if false. */
  isCleared?: boolean;

  /** Don’t show while the surrounding field is read-only. */
  readOnly?: boolean;
}

export function ClearAllButton({
  fieldName,
  onClearLocal,
  isCleared = false,
  readOnly
}: ClearAllButtonProps) {
  const bulkCtx = useBulkEditTabContext();
  const { formatMessage } = useIntl();

  if (readOnly) return null;

  function handleClear() {
    onClearLocal();

    if (bulkCtx) {
      const cleared = new Set(bulkCtx.clearedFields);
      cleared.add(fieldName);
      bulkCtx?.setClearedFields?.(cleared);
    }
  }

  function handleUndo() {
    if (bulkCtx) {
      const cleared = new Set(bulkCtx.clearedFields);
      cleared.delete(fieldName);
      bulkCtx?.setClearedFields?.(cleared);
    }
  }

  if (isCleared) {
    return (
      <Tooltip
        directText={formatMessage({ id: "undoClearedTooltip" as any })}
        placement="right"
        visibleElement={
          <button
            type="button"
            className="btn"
            onClick={handleUndo}
            data-testid={`undo-clear-button-${fieldName}`}
          >
            <FaUndo />
          </button>
        }
      />
    );
  }

  return (
    <Tooltip
      directText={formatMessage({ id: "clearedTooltip" as any })}
      placement="right"
      visibleElement={
        <button
          type="button"
          className="btn"
          onClick={handleClear}
          data-testid={`clear-all-button-${fieldName}`}
        >
          <FaEraser />
        </button>
      }
    />
  );
}
