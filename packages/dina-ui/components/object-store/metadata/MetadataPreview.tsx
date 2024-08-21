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
                <a>
                  <DinaMessage id="detailsPageLink" />
                </a>
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
                >
                  <a className="btn btn-primary metadata-edit-link">
                    <DinaMessage id="editButtonText" />
                  </a>
                </Link>
              </div>
              <Link
                href={`/object-store/metadata/revisions?id=${metadataId}&isExternalResourceMetadata=${!!metadata?.resourceExternalURL}`}
              >
                <a className="btn btn-info metadata-revisions-link">
                  <DinaMessage id="revisionsButtonText" />
                </a>
              </Link>
            </div>
          </div>
          {metadata.resourceExternalURL && metadata.derivatives && (
            <MetadataFileView metadata={metadata} preview={true} />
          )}
          {metadata.fileIdentifier && (
            <>
              <MetadataFileView metadata={metadata} preview={true} />
              <NotPubliclyReleasableWarning />
              <div className="px-3">
                <TagsAndRestrictionsSection tagsFieldName="acTags" />
              </div>
            </>
          )}
          <MetadataBadges tagsFieldName="acTags" />
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
