import React, { useEffect, useState } from "react";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import { CollapsableSection } from "../metadata/MetadataDetails";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { ReactTable, useApiClient, useBlobLoad } from "common-ui";
import { FaUpRightFromSquare } from "react-icons/fa6";
import { DownloadLink } from "../file-view/FileView";
import { handleDownloadLink } from "../object-store-utils";

// This is a map of derivative types to their corresponding messages.
const DERIVATIVE_TYPE_MESSAGES = new Map<string, string>([
  ["THUMBNAIL_IMAGE", "thumbnail"],
  ["LARGE_IMAGE", "largeImg"],
  ["CROPPED_IMAGE", "croppedImg"]
]);

export interface DerivativeListProps {
  metadata: Metadata;
}

export function DerivativeList({ metadata }: DerivativeListProps) {
  const { formatMessage, messages } = useDinaIntl();
  const { apiClient } = useApiClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDerivativePath, setSelectedDerivativePath] =
    useState<string>();

  useBlobLoad({
    filePath: selectedDerivativePath,
    autoOpen: true
  });

  // Reset the selected derivative path when it changes.
  useEffect(() => {
    if (selectedDerivativePath) {
      setSelectedDerivativePath(undefined);
    }
  }, [selectedDerivativePath]);

  // If no derivatives, return null.
  if (!metadata.derivatives || metadata.derivatives.length === 0) {
    return null;
  }

  return (
    <CollapsableSection
      collapserId="derivatives"
      title={formatMessage("derivatives")}
    >
      <ReactTable
        className="-striped"
        columns={[
          {
            id: "type",
            accessorKey: "derivativeType",
            header: () => <DinaMessage id="type" />,
            cell: ({
              row: {
                original: { derivativeType }
              }
            }) =>
              messages?.[DERIVATIVE_TYPE_MESSAGES.get(derivativeType) ?? ""] ? (
                <strong>
                  <DinaMessage
                    id={
                      DERIVATIVE_TYPE_MESSAGES.get(derivativeType) ??
                      (derivativeType as any)
                    }
                  />
                </strong>
              ) : (
                <strong>derivativeType</strong>
              ),
            enableSorting: true
          },
          {
            id: "dcFormat",
            accessorKey: "dcFormat",
            header: () => <DinaMessage id="field_dcFormat" />
          },
          {
            id: "actions",
            accessorKey: "actions",
            header: () => <DinaMessage id="actions" />,
            cell: ({
              row: {
                original: { fileIdentifier, bucket }
              }
            }) => (
              <div className="d-flex justify-content-center">
                {/* View Button */}
                <a
                  onClick={() => {
                    setSelectedDerivativePath(
                      `/objectstore-api/file/${bucket}/derivative/${fileIdentifier}`
                    );
                    setIsDownloading(false);
                  }}
                  className="btn btn-primary"
                >
                  <FaUpRightFromSquare className="me-2" />
                  <DinaMessage id="view" />
                </a>

                {/* Download Button */}
                <DownloadLink
                  id="downloadFile"
                  path={`/objectstore-api/file/${bucket}/derivative/${fileIdentifier}`}
                  isDownloading={isDownloading}
                  handleDownloadLink={handleDownloadLink}
                  apiClient={apiClient}
                  setIsDownloading={setIsDownloading}
                  classname="ms-2"
                />
              </div>
            ),
            enableSorting: false
          }
        ]}
        data={metadata.derivatives ?? []}
      />
    </CollapsableSection>
  );
}
