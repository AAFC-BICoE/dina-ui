import { FaEraser } from "react-icons/fa";
import { Tooltip } from "../tooltip/Tooltip";
import { useBulkEditTabContext } from "./bulk-context";
import { useIntl } from "react-intl";

export interface ClearAllButtonProps {
  /** Field’s full Formik path, e.g. "dwcDecimalLatitude". */
  fieldName: string;

  /** Called after the field is blanked; usually `setValue("")`. */
  onClearLocal: () => void;

  /** Whether the button should be shown (e.g. only when multiple values). */
  visible?: boolean;

  /** Don’t show while the surrounding field is read-only. */
  readOnly?: boolean;
}

export function ClearAllButton({
  fieldName,
  onClearLocal,
  visible = true,
  readOnly
}: ClearAllButtonProps) {
  const bulkCtx = useBulkEditTabContext();
  const { formatMessage } = useIntl();

  if (!visible || readOnly) return null;

  function handleClick() {
    onClearLocal();

    if (bulkCtx) {
      const cleared = new Set(bulkCtx.clearedFields);
      cleared.add(fieldName);
      bulkCtx?.setClearedFields?.(cleared);
    }
  }

  return (
    <Tooltip
      directText={formatMessage({ id: "clearedTooltip" as any })}
      placement="right"
      visibleElement={
        <button type="button" className="btn" onClick={handleClick}>
          <FaEraser />
        </button>
      }
    />
  );
}
