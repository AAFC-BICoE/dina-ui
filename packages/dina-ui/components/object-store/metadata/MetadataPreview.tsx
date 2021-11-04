import { DinaForm, LoadingSpinner } from "common-ui";
import Link from "next/link";
import {
  NotPubliclyReleasableWarning,
  TagsAndRestrictionsSection
} from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExifView } from "../exif-view/ExifView";
import { MetadataDetails, useMetadataQuery } from "./MetadataDetails";
import { MetadataFileView } from "./MetadataFileView";

interface MetadataPreviewProps {
  metadataId: string;
}

/**
 * Metadata preview component to be used on the side panel of the Metadata list page.
 */
export function MetadataPreview({ metadataId }: MetadataPreviewProps) {
  const { loading, response } = useMetadataQuery(metadataId);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    return (
      <div className="metadata-preview">
        <DinaForm initialValues={metadata} readOnly={true}>
          <div className="metadata-edit-link">
            <Link
              href={`/object-store/metadata/single-record-edit?id=${metadataId}`}
            >
              <a className="btn btn-primary metadata-edit-link">
                <DinaMessage id="editButtonText" />
              </a>
            </Link>
          </div>
          <Link href={`/object-store/metadata/revisions?id=${metadataId}`}>
            <a className="btn btn-info metadata-revisions-link">
              <DinaMessage id="revisionsButtonText" />
            </a>
          </Link>
          <MetadataFileView metadata={metadata} />
          <NotPubliclyReleasableWarning />
          <div className="px-3">
            <TagsAndRestrictionsSection tagsFieldName="acTags" />
          </div>
          <MetadataDetails metadata={metadata} />
          <ExifView objectUpload={metadata.objectUpload} />
        </DinaForm>
      </div>
    );
  }

  return null;
}
