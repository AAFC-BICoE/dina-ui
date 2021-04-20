import { LoadingSpinner } from "common-ui";
import Link from "next/link";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExifView } from "../exif-view/ExifView";
import { FileView } from "../file-view/FileView";
import { MetadataDetails, useMetadataQuery } from "./MetadataDetails";
import { MetadataFileView } from "./MetadataFileView";

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
  const { loading, response } = useMetadataQuery(metadataId);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    return (
      <div className="metadata-preview">
        <style>{METADATA_PREVIEW_STYLE}</style>
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
        <MetadataDetails metadata={metadata} />
        <ExifView objectUpload={metadata.objectUpload} />
      </div>
    );
  }

  return null;
}
