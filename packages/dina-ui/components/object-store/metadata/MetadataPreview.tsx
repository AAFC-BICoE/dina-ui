import { ApiClientContext, LoadingSpinner, useQuery } from "common-ui";
import Link from "next/link";
import { ObjectUpload } from "packages/dina-ui/types/objectstore-api/resources/ObjectUpload";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { FileView } from "../file-view/FileView";
import { MetadataDetails } from "./MetadataDetails";
import { useContext } from "react";
import { ExifView } from "../exif-view/ExifView";

interface MetadataPreviewProps {
  metadataId: string;
}

const METADATA_PREVIEW_STYLE = `
  .metadata-preview .file-viewer-wrapper img {
    height: 12rem;
  }
`;

async function retrieveObjectUpload(metadata: Metadata): Promise<ObjectUpload> {
  const { apiClient } = useContext(ApiClientContext);
  const objectUploadResp = await apiClient.axios.get<ObjectUpload>(
    `/objectstore-api/object-upload/${metadata.fileIdentifier}`
  );
  return objectUploadResp?.data;
}

/**
 * Metadata preview component to be used on the side panel of the Metadata list page.
 */
export function MetadataPreview({ metadataId }: MetadataPreviewProps) {
  const { loading, response } = useQuery<Metadata>(
    {
      include: "acDerivedFrom,managedAttributeMap,acMetadataCreator,dcCreator",
      path: `objectstore-api/metadata/${metadataId}`
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "acMetadataCreator",
          joinField: "acMetadataCreator",
          path: metadata => `person/${metadata.acMetadataCreator.id}`
        },
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: metadata => `person/${metadata.dcCreator.id}`
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

    const objectUpload = retrieveObjectUpload(metadata);

    return (
      <div className="metadata-preview">
        <style>{METADATA_PREVIEW_STYLE}</style>
        <div className="metadata-edit-link">
          <Link href={`/object-store/metadata/edit?ids=${metadataId}`}>
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
        <FileView
          clickToDownload={true}
          filePath={filePath}
          fileType={fileType}
        />
        <MetadataDetails metadata={metadata} />
        <ExifView objectUpload={objectUpload as any} />
      </div>
    );
  }

  return null;
}
