import { AreYouSureModal, ExternalLink } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { generateSearchURLFromSimpleRows } from "common-ui/lib/list-page/query-url/queryUtils";

interface CollectingEventEditAlertProps {
  /** The number of material samples linked. Shows if > 1. */
  materialSampleUsageCount?: number | null;

  /** Localized text id for the warning message. Warning always assumes a count is provided. */
  alertMessage?: string;

  /**
   * Used for the collecting event details link and generating the query to display the current
   * material samples linked.
   */
  collectingEventUUID?: string;

  /** Whether to display the link to the Collecting Event Details page. */
  displayCollectingEventDetailsLink?: boolean;

  /**
   * Override the don't render condition. Helpful if the condition is already being checked by
   * the parent component.
   *
   * Default is false so it will use the internal check.
   */
  override?: boolean;
}

/**
 * Displays a warning alert with a link to view the associated Material Samples.
 */
function CollectingEventEditAlert({
  materialSampleUsageCount,
  alertMessage = "collectingEventEditAlertMessage",
  collectingEventUUID,
  displayCollectingEventDetailsLink = false,
  override = false
}: CollectingEventEditAlertProps) {
  const resolvedUsageCount =
    materialSampleUsageCount ?? (override ? 1 : undefined);

  // Don't render if there are not multiple usages.
  if (!override && (!resolvedUsageCount || resolvedUsageCount <= 1)) {
    return null;
  }

  // Generate the search URL for Material Samples linked to this Collecting Event.
  const relationshipPresenceUUIDSearch = generateSearchURLFromSimpleRows([
    {
      f: "_relationshipPresence",
      o: "uuid",
      v: "collectingEvent",
      t: "relationshipPresence",
      d: collectingEventUUID ?? ""
    }
  ]);

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
              id={
                (alertMessage +
                  (alertMessage === "collectingEventEditErrorMessage" &&
                  resolvedUsageCount === 1
                    ? "Single"
                    : "")) as any
              }
              values={{ count: resolvedUsageCount }}
            />
          </span>
          {collectingEventUUID && (
            <span>
              <br />
              <ExternalLink
                className="mt-2"
                href={{
                  pathname: `/collection/material-sample/list`,
                  query: {
                    queryTree: relationshipPresenceUUIDSearch
                  }
                }}
              >
                <DinaMessage id="collectingEventViewMaterialSamplesAttached" />{" "}
              </ExternalLink>
            </span>
          )}
          {displayCollectingEventDetailsLink && collectingEventUUID && (
            <span>
              <br />
              <ExternalLink
                className="mt-2"
                href={{
                  pathname: `/collection/collecting-event/view`,
                  query: {
                    id: collectingEventUUID
                  }
                }}
              >
                <DinaMessage id="collectingEventGoToDetails" />{" "}
              </ExternalLink>
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
 * @param onYesButtonClicked An async function to perform when the user confirms.
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
