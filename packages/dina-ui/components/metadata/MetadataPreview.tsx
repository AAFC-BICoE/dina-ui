import { LoadingSpinner, useQuery } from "common-ui";
import Link from "next/link";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Metadata } from "../../types/objectstore-api";
import { FileView } from "../file-view/FileView";
import { MetadataDetails } from "./MetadataDetails";

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
  const { loading, response } = useQuery<Metadata>(
    {
      include: "acDerivedFrom,managedAttributeMap",
      path: `objectstore-api/metadata/${metadataId}`
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "acMetadataCreator",
          joinField: "acMetadataCreator",
          path: metadata => `person/${metadata.acMetadataCreator}`
        },
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: metadata => `person/${metadata.dcCreator}`
        }
      ]
    }
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const filePath = `/api/objectstore-api/file/${metadata.bucket}/${metadata.fileIdentifier}`;
    const fileType = metadata.fileExtension.replace(/\./, "").toLowerCase();

    return (
      <div className="metadata-preview">
        <style>{METADATA_PREVIEW_STYLE}</style>
        <div className="metadata-edit-link">
          <Link href={`/object-store/metadata/edit?ids=${metadataId}`}>
            <a className="btn btn-primary">
              <DinaMessage id="editButtonText" />
            </a>
          </Link>
        </div>
        <FileView
          clickToDownload={true}
          filePath={filePath}
          fileType={fileType}
        />
        <MetadataDetails metadata={metadata} />
      </div>
    );
  }

  return null;
}
