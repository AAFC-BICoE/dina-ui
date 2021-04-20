import { Metadata } from "../../../types/objectstore-api";
import { FileView } from "../file-view/FileView";

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

  const filePath = `/api/objectstore-api/file/${fileToDisplay.bucket}/${fileId}`;
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
    />
  );
}
