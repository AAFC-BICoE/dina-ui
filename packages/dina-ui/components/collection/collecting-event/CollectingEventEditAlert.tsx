import Link from "next/link";
import { AreYouSureModal } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

interface CollectingEventEditAlertProps {
  /** The number of material samples linked. Shows if > 1. */
  materialSampleUsageCount?: number | null;

  /** Localized text id for the warning message. Warning always assumes a count is provided. */
  alertMessage?: string;

  /** Populate if you want the "Go to collecting event details" link to appear. */
  collectingEventUUID?: string;
}

/**
 * Displays a warning alert with a link to view the associated Material Samples.
 */
function CollectingEventEditAlert({
  materialSampleUsageCount,
  alertMessage = "collectingEventEditAlertMessage",
  collectingEventUUID
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
        <div>
          <span>
            <DinaMessage
              id={alertMessage as any}
              values={{ count: materialSampleUsageCount }}
            />
          </span>
          {collectingEventUUID && (
            <span>
              <br />
              <Link
                className="mt-2"
                href={{
                  pathname: `/collection/collecting-event/view`,
                  query: {
                    id: collectingEventUUID
                  }
                }}
                target="_blank"
              >
                <DinaMessage id="collectingEventGoToDetails" />{" "}
                <FaArrowUpRightFromSquare
                  style={{
                    marginLeft: "0.25em"
                  }}
                  aria-label="Opens in new tab"
                />
              </Link>
            </span>
          )}
        </div>
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
