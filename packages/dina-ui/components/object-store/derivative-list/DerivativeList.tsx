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
import Link from "next/link";

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
            accessorFn: (row) => (row as any).objectUpload?.sizeInBytes,
            header: () => <DinaMessage id="field_dcSize" />,
            cell: ({ getValue }) => {
              const value = getValue();
              return value === undefined ? (
                <span className="text-muted">-</span>
              ) : (
                <span>{formatBytes(value)}</span>
              );
            },
            sortingFn: (rowA, rowB, columnId) => {
              const a = rowA.getValue(columnId);
              const b = rowB.getValue(columnId);

              // Put undefined values at the bottom
              if (a === undefined && b === undefined) return 0;
              else if (a === undefined) return 1; // a goes to bottom
              else if (b === undefined) return -1; // b goes to bottom
              else
                return typeof a === "number" && typeof b === "number"
                  ? a - b
                  : 0; // Normal numeric sorting for defined values
            },
            enableSorting: true
          },
          {
            id: "actions",
            accessorKey: "actions",
            header: () => <DinaMessage id="actions" />,
            cell: ({
              row: {
                original: { id, bucket, fileIdentifier }
              }
            }) => (
              <div className="d-flex justify-content-center">
                {/* View Button */}
                <Link
                  href={`/object-store/derivatives/derivative-view?id=${id}&parentId=${metadata.id}`}
                  passHref={true}
                >
                  <a className="btn btn-primary">
                    <FaUpRightFromSquare className="me-2" />
                    <DinaMessage id="view" />
                  </a>
                </Link>

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
