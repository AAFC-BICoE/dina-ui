import { AreYouSureModal, ExternalLink } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { generateSearchURLFromSimpleRows } from "common-ui/lib/list-page/query-url/queryUtils";

/** The material samples list, filtered to the samples linked to this collecting event. */
export function getLinkedMaterialSamplesHref(collectingEventUUID: string) {
  return {
    pathname: "/collection/material-sample/list",
    query: {
      queryTree: generateSearchURLFromSimpleRows([
        {
          f: "_relationshipPresence",
          o: "uuid",
          v: "collectingEvent",
          t: "relationshipPresence",
          d: collectingEventUUID
        }
      ])
    }
  };
}

interface CollectingEventEditAlertProps {
  /** The number of material samples linked. Shows if > 1. */
  materialSampleUsageCount?: number | null;

  /** Used to link to the material samples currently linked to the collecting event. */
  collectingEventUUID?: string;
}

/**
 * Displays a warning alert with a link to view the associated Material Samples.
 */
function CollectingEventEditAlert({
  materialSampleUsageCount,
  collectingEventUUID
}: CollectingEventEditAlertProps) {
  // Don't render if there are not multiple usages.
  if (!materialSampleUsageCount || materialSampleUsageCount <= 1) {
    return null;
  }

  return (
    <div className="alert alert-info py-2 mb-3" role="status">
      <div className="d-flex gap-3">
        <FaInfoCircle
          aria-hidden="true"
          style={{ width: "20px", height: "20px", flexShrink: 0 }}
        />
        <div>
          <span>
            <DinaMessage
              id="collectingEventEditAlertMessage"
              values={{ count: materialSampleUsageCount }}
            />
          </span>
          {collectingEventUUID && (
            <span>
              <br />
              <ExternalLink
                className="mt-2"
                href={getLinkedMaterialSamplesHref(collectingEventUUID)}
              >
                <DinaMessage
                  id="collectingEventViewMaterialSamplesAttached"
                  values={{ count: materialSampleUsageCount }}
                />{" "}
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
