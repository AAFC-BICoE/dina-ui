import { DinaForm, LoadingSpinner } from "common-ui";
import Link from "next/link";
import {
  NotPubliclyReleasableWarning,
  TagsAndRestrictionsSection
} from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExifView } from "../exif-view/ExifView";
import { MetadataDetails } from "./MetadataDetails";
import { MetadataFileView } from "./MetadataFileView";
import { useMetadataViewQuery } from "./useMetadata";

interface MetadataPreviewProps {
  metadataId: string;
}

const METADATA_PREVIEW_STYLE = `
  .metadata-preview .file-viewer-wrapper img {
    height: 12rem;
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
          <div className="metadata-edit-link">
            <Link
              href={`/object-store/metadata/${
                metadata.resourceExternalURL ? "external-resource-edit" : "edit"
              }?id=${metadataId}`}
            >
              <a className="btn btn-primary metadata-edit-link">
                <DinaMessage id="editButtonText" />
              </a>
            </Link>
          </div>
          <Link
            href={`/object-store/metadata/revisions?id=${metadataId}&isExternalResourceMetadata=${!!metadata.resourceExternalURL}`}
          >
            <a className="btn btn-info metadata-revisions-link">
              <DinaMessage id="revisionsButtonText" />
            </a>
          </Link>
          {metadata.fileIdentifier && (
            <>
              <MetadataFileView metadata={metadata} />
              <NotPubliclyReleasableWarning />
              <div className="px-3">
                <TagsAndRestrictionsSection tagsFieldName="acTags" />
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
