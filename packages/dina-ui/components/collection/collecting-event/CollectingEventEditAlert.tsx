import { AreYouSureModal } from "common-ui";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
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
          <DinaMessage
            id="collectingEventEditAlertMessage"
            values={{ count: materialSampleUsageCount }}
          />
        </span>
      </div>
    </div>
  );
}

/**
 * Renders the confirmation modal to be displayed when editing a Collecting Event
 * linked to multiple Material Samples.
 *
 * @param count The number of linked material samples.
 * @param onYesButtonClicked The action to perform when the user confirms.
 */
export function renderConfirmationModal(
  count: number,
  onYesButtonClicked: () => Promise<void>
) {
  return (
    <AreYouSureModal
      actionMessage={<DinaMessage id="collectingEventEditAlertTitle" />}
      messageBody={
        <DinaMessage id="collectingEventEditAlertMessage" values={{ count }} />
      }
      noButtonText={<DinaMessage id="cancelButtonText" />}
      yesButtonText={<DinaMessage id="update" />}
      onYesButtonClicked={onYesButtonClicked}
    />
  );
}

export default CollectingEventEditAlert;
