import { DinaForm, LoadingSpinner } from "common-ui";
import {
  NotPubliclyReleasableWarning,
  TagsAndRestrictionsSection
} from "../..";
import { ExifView } from "../exif-view/ExifView";
import { MetadataDetails } from "./MetadataDetails";
import { MetadataFileView } from "./MetadataFileView";
import { useMetadataViewQuery } from "./useMetadata";
import Link from "next/link";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import MetadataBadges from "./MetadataBadges";
import { useMemo } from "react";
import { FaRegClock } from "react-icons/fa";
import React from "react";
import { MdEdit } from "react-icons/md";

interface MetadataPreviewProps {
  metadataId: string;
}

const METADATA_PREVIEW_STYLE = `
  .metadata-preview .file-viewer-wrapper img {
    width: 100%;
    max-height: 25rem;
  }
`;

/**
 * Metadata preview component to be used on the side panel of the Metadata list page.
 */
export function MetadataPreview({ metadataId }: MetadataPreviewProps) {
  const { loading, response } = useMetadataViewQuery(metadataId);
  const fileName = useMemo(
    () => response?.data?.filename ?? response?.data?.originalFilename,
    [response]
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    return (
      <div className="metadata-preview">
        <DinaForm initialValues={metadata} readOnly={true}>
          <style>{METADATA_PREVIEW_STYLE}</style>
          <div className="row align-items-center preview-buttonbar">
            <div className="col">
              {" "}
              <Link
                href={`/object-store/object/${
                  metadata?.resourceExternalURL
                    ? "external-resource-view"
                    : "view"
                }?id=${metadataId}`}
              >
                <DinaMessage id="detailsPageLink" />
              </Link>
            </div>
            <div className="col-auto d-flex justify-content-end">
              {" "}
              <div className="metadata-edit-link me-2">
                {" "}
                <Link
                  href={`/object-store/metadata/${
                    metadata?.resourceExternalURL
                      ? "external-resource-edit"
                      : "edit"
                  }?id=${metadataId}`}
                  className="btn btn-primary metadata-edit-link"
                >
                  <MdEdit className="me-2" />
                  <DinaMessage id="editButtonText" />
                </Link>
              </div>
              <Link
                href={`/object-store/metadata/revisions?id=${metadataId}&isExternalResourceMetadata=${!!metadata?.resourceExternalURL}`}
                className="btn btn-info metadata-revisions-link"
              >
                <FaRegClock className="me-2" />
                <DinaMessage id="revisionsButtonText" />
              </Link>
            </div>
          </div>
          {metadata.resourceExternalURL && metadata.derivatives && (
            <MetadataFileView metadata={metadata} hideDownload={false} />
          )}
          {metadata.fileIdentifier && (
            <>
              <MetadataFileView metadata={metadata} hideDownload={false} />
              <div className="row d-flex">
                <div className="col-md-12">
                  <h1
                    style={{ marginTop: 0 }}
                    className="d-inline-flex flex-row w-100"
                  >
                    {fileName}
                    <div className="ms-auto">
                      <NotPubliclyReleasableWarning />
                    </div>
                  </h1>
                  <TagsAndRestrictionsSection tagsFieldName="acTags" />
                  <MetadataBadges tagsFieldName="acTags" />
                </div>
              </div>
            </>
          )}
          <MetadataDetails metadata={metadata} />
          {metadata.fileIdentifier && (
            <ExifView objectUpload={metadata.objectUpload} />
          )}
        </DinaForm>
      </div>
    );
  }

  return null;
}
