import React from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { DownLoadLinks, FileView } from "../file-view/FileView";
import { LoadingSpinner } from "common-ui";

export interface MetadataFileViewProps {
  metadata: Metadata;
  imgHeight?: string;
  hideDownload?: boolean;
}

export function getFileToDisplay(metadata) {
  // 1. Try LARGE_IMAGE derivative first (highest quality preview)
  const largeImageDerivative = metadata?.derivatives?.find(
    (it) => it.derivativeType === "LARGE_IMAGE"
  );
  if (largeImageDerivative) {
    return largeImageDerivative;
  }

  // 2. Try original file if it's not too large and has a fileIdentifier
  if (metadata.fileIdentifier) {
    // Check if file size is under 30MB (30 * 1024 * 1024 bytes)
    const isFileSizeOk =
      !metadata.fileSizeBytes || metadata.fileSizeBytes < 31457280;

    // List of previewable file types we can display natively.
    const previewableTypes = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "svg",
      "ico",
      "webp",
      "bmp" // Browser supported image formats
    ];

    // Check if extension is in the previewable list
    const fileExt = (metadata.fileExtension || "")
      .replace(/^\./, "")
      .toLowerCase();
    const isPreviewableType = previewableTypes.includes(fileExt);

    // If within size limit and previewable type, use original
    if (isFileSizeOk && isPreviewableType) {
      return metadata;
    }
  }

  // 3. Try THUMBNAIL_IMAGE derivative
  const thumbnailImageDerivative = metadata?.derivatives?.find(
    (it) => it.derivativeType === "THUMBNAIL_IMAGE"
  );
  if (thumbnailImageDerivative) {
    return thumbnailImageDerivative;
  }

  // 4. If we got here, we have no suitable preview
  // Return the metadata itself, but let FileView know this isn't previewable
  // by adding a flag.
  return metadata;
}

/** Displays the file for the given metadata. */
export function MetadataFileView({
  metadata,
  imgHeight,
  hideDownload
}: MetadataFileViewProps) {
  const { formatMessage } = useDinaIntl();

  const fileToDisplay = React.useMemo(() => {
    if (metadata) {
      return getFileToDisplay(metadata);
    }
    return null;
  }, [metadata]);

  const fileId = React.useMemo(() => {
    if (fileToDisplay) {
      return fileToDisplay?.fileIdentifier;
    }
    return null;
  }, [fileToDisplay]);

  const filePath = React.useMemo(() => {
    if (fileToDisplay) {
      return `/objectstore-api/file/${fileToDisplay.bucket}/${
        // Add derivative/ before the fileIdentifier if the file to display is a derivative.
        fileToDisplay.type === "derivative" ? "derivative/" : ""
      }${fileId}`;
    }
    return null;
  }, [fileToDisplay, fileId]);

  const downloadLinks: DownLoadLinks = {};

  const COMMON_LINK_ROOT = "/objectstore-api/file/";

  // External resources do not have original files.
  if (!metadata.resourceExternalURL) {
    downloadLinks.original = `${COMMON_LINK_ROOT}${metadata.bucket}/${metadata.fileIdentifier}`;
  }

  // fileExtension should always be available when getting the Metadata from the back-end:
  const fileType = React.useMemo(() => {
    if (fileToDisplay?.fileExtension) {
      return fileToDisplay.fileExtension.replace(/\./, "").toLowerCase();
    }
    return null;
  }, [fileToDisplay]);

  const imgTypeText = React.useMemo(() => {
    if (fileToDisplay) {
      return fileToDisplay.type === "derivative"
        ? fileToDisplay.derivativeType === "LARGE_IMAGE"
          ? "largeImg"
          : fileToDisplay.derivativeType === "THUMBNAIL_IMAGE"
          ? "thumbnail"
          : null
        : "originalFile";
    }
    return null;
  }, [fileToDisplay]);

  if (filePath === null) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div>
      <div className="mb-3">
        <FileView
          imgAlt={
            metadata?.acCaption
              ? metadata.acCaption
              : metadata?.originalFilename
          }
          clickToDownload={true}
          filePath={filePath}
          fileType={fileType}
          imgHeight={imgHeight}
          downloadLinks={downloadLinks}
          shownTypeIndicator={
            imgTypeText && (
              <div className="shown-file-type">
                <strong>
                  <DinaMessage id="showing" />:
                </strong>
                {` ${formatMessage(imgTypeText)}`}
              </div>
            )
          }
          hideDownload={hideDownload}
          metadata={metadata}
        />
      </div>
    </div>
  );
}
