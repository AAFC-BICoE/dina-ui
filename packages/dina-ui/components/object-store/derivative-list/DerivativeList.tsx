import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import { CollapsableSection } from "../metadata/MetadataDetails";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  LoadingSpinner,
  ReactTable,
  useApiClient,
  useBlobLoad
} from "common-ui";
import { FaDownload, FaUpRightFromSquare } from "react-icons/fa6";
import {
  derivativeTypeToLabel,
  handleDownloadLink
} from "../object-store-utils";
import Kitsu from "kitsu";
import { formatBytes } from "../object-store-utils";
import { useQuery } from "common-ui";

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

  // Cell component to display the size of the derivative (no value for auto-generated thumbnails).
  function DerivativeSizeCell({ filePath }: { filePath: string }) {
    const { loading, response } = useQuery({
      path: filePath ?? "",
      timeout: 0,
      header: { "include-dina-permission": "true" }
    });

    if (loading) {
      return <LoadingSpinner loading={true} />;
    }

    if (response) {
      const fileSize = (response.data as any)?.sizeInBytes ?? 0;

      return <span>{formatBytes(fileSize)}</span>;
    }

    return <span>-</span>;
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
            }) => (
              <strong>{derivativeTypeToLabel(derivativeType, messages)}</strong>
            ),
            enableSorting: true
          },
          {
            id: "dcFormat",
            accessorKey: "dcFormat",
            header: () => <DinaMessage id="field_dcFormat" />
          },
          {
            id: "dcSize",
            accessorKey: "dcSize",
            header: () => <DinaMessage id="field_dcSize" />,
            cell: ({
              row: {
                original: { fileIdentifier }
              }
            }) => (
              <DerivativeSizeCell
                filePath={`/objectstore-api/object-upload/${fileIdentifier}`}
              />
            ),
            enableSorting: true
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
                <DownloadButton
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

interface DownloadButtonProps {
  id: string;
  path: string;
  isDownloading: boolean;
  handleDownloadLink: (
    path: string,
    apiClient: Kitsu,
    setIsDownloading: Dispatch<SetStateAction<boolean>>
  ) => Promise<any>;
  apiClient: Kitsu;
  setIsDownloading: Dispatch<SetStateAction<boolean>>;
  classname?: string;
}

export function DownloadButton({
  id,
  path,
  isDownloading,
  handleDownloadLink,
  apiClient,
  setIsDownloading,
  classname
}: DownloadButtonProps) {
  return isDownloading ? (
    <LoadingSpinner additionalClassNames={classname} loading={true} />
  ) : (
    <a
      className={`${classname} original btn btn-primary`}
      style={{ cursor: "pointer" }}
      onClick={() => handleDownloadLink(path, apiClient, setIsDownloading)}
    >
      <FaDownload className="me-2" />
      <DinaMessage id={id as any} />
    </a>
  );
}
