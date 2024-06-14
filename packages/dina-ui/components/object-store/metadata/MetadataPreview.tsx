import { DinaForm, LoadingSpinner } from "common-ui";
import {
  NotPubliclyReleasableWarning,
  TagsAndRestrictionsSection
} from "../..";
import { ExifView } from "../exif-view/ExifView";
import { MetadataDetails } from "./MetadataDetails";
import { MetadataFileView, getFileToDisplay } from "./MetadataFileView";
import { useMetadataViewQuery } from "./useMetadata";

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
