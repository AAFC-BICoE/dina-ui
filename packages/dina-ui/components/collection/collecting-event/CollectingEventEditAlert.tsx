import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

interface CollectingEventEditAlertProps {
  /** The number of material samples linked. Shows if > 1. */
  materialSampleUsageCount?: number | null;
}

/**
 * Displays a warning alert with a link to view the associated Material Samples.
 */
function CollectingEventEditAlert({
  materialSampleUsageCount
}: CollectingEventEditAlertProps) {
  // Don't render if there are not multiple usages.
  if (!materialSampleUsageCount || materialSampleUsageCount <= 1) {
    return null;
  }

  return (
    <div className="alert alert-warning" role="alert">
      <div className="d-flex gap-3">
        <FaExclamationTriangle
          aria-hidden="true"
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        />
        <span>
          This collecting event is linked to{" "}
          <strong>{materialSampleUsageCount} material samples</strong>. Please
          ensure that any changes made here are appropriate for all linked
          material samples.
        </span>
      </div>
    </div>
  );
}

export default CollectingEventEditAlert;
