import { Metadata } from "../../../types/objectstore-api";
import { DownLoadLinks, FileView } from "../file-view/FileView";

export interface MetadataFileViewProps {
  metadata: Metadata;
  imgHeight?: string;
}

/** Displays the file for the given metadata. */
export function MetadataFileView({
  metadata,
  imgHeight
}: MetadataFileViewProps) {
  // If there is a linked "LARGE_IMAGE" Derivative then render it:
  const fileToDisplay =
    metadata.derivatives?.find(it => it.derivativeType === "LARGE_IMAGE") ??
    metadata;

  // If the file is a thumbnail then show the thumbnail:
  const fileId =
    fileToDisplay.type === "metadata" && fileToDisplay.acSubType === "THUMBNAIL"
      ? `${fileToDisplay.fileIdentifier}/thumbnail`
      : fileToDisplay.fileIdentifier;

  const filePath = `/api/objectstore-api/file/${fileToDisplay.bucket}/${
    // Add derivative/ before the fileIdentifier if the file to display is a derivative.
    fileToDisplay.type === "derivative" ? "derivative/" : ""
  }${fileId}`;

  const downloadLinks: DownLoadLinks = {};

  const COMMON_LINK_ROOT = "/api/objectstore-api/file/";

  const largeImg = metadata.derivatives?.find(
    it => it.derivativeType === "LARGE_IMAGE"
  );
  const thumbnailImg = metadata.derivatives?.find(
    it => it.derivativeType === "THUMBNAIL_IMAGE"
  );

  // populate the original if this is thumbnail metadata
  if (metadata.type === "metadata" && metadata.acSubType === "THUMBNAIL") {
    const acDerivedFrom = thumbnailImg?.acDerivedFrom as any;
    downloadLinks.original = `${COMMON_LINK_ROOT}${metadata.bucket}/${acDerivedFrom?.fileIdentifier}`;
  }

  // populate the original and thumbnail if this meta has large data,
  // hence large data is available as default to download upon click
  if (largeImg) {
    downloadLinks.original = `${COMMON_LINK_ROOT}${metadata.bucket}/${metadata.fileIdentifier}`;
    if (thumbnailImg)
      downloadLinks.thumbNail = `${COMMON_LINK_ROOT}${metadata.bucket}/thumbnail/${thumbnailImg.fileIdentifier}`;
  }

  // fileExtension should always be available when getting the Metadata from the back-end:
  const fileType = (fileToDisplay.fileExtension as string)
    .replace(/\./, "")
    .toLowerCase();

  return (
    <FileView
      clickToDownload={true}
      filePath={filePath}
      fileType={fileType}
      imgHeight={imgHeight}
      downloadLinks={downloadLinks}
    />
  );
}
