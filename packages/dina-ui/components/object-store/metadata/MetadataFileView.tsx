import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
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
  const { formatMessage } = useDinaIntl();

  // If there is a linked "LARGE_IMAGE" Derivative then render it:
  const fileToDisplay =
    metadata.derivatives?.find(it => it.derivativeType === "LARGE_IMAGE") ??
    metadata;

  const fileId = fileToDisplay.fileIdentifier;

  const filePath = `/api/objectstore-api/file/${fileToDisplay.bucket}/${
    // Add derivative/ before the fileIdentifier if the file to display is a derivative.
    fileToDisplay.type === "derivative" ? "derivative/" : ""
  }${fileId}`;

  const downloadLinks: DownLoadLinks = {};

  const COMMON_LINK_ROOT = "/api/objectstore-api/file/";

  const largeImgDerivative = metadata.derivatives?.find(
    it => it.derivativeType === "LARGE_IMAGE"
  );
  const thumbnailImgDerivative = metadata.derivatives?.find(
    it => it.derivativeType === "THUMBNAIL_IMAGE"
  );

  downloadLinks.original = `${COMMON_LINK_ROOT}${metadata.bucket}/${metadata.fileIdentifier}`;

  // populate the thumbnail link
  if (thumbnailImgDerivative) {
    downloadLinks.thumbNail = `${COMMON_LINK_ROOT}${metadata.bucket}/${metadata?.fileIdentifier}/thumbnail`;
  }

  // populate the large data link
  if (largeImgDerivative) {
    downloadLinks.largeData = `${COMMON_LINK_ROOT}${largeImgDerivative.bucket}/derivative/${largeImgDerivative?.fileIdentifier}`;
  }

  // fileExtension should always be available when getting the Metadata from the back-end:
  const fileType = (fileToDisplay.fileExtension as string)
    .replace(/\./, "")
    .toLowerCase();

  const imgTypeText =
    fileToDisplay.type === "derivative"
      ? fileToDisplay.derivativeType === "LARGE_IMAGE"
        ? "largeImg"
        : fileToDisplay.derivativeType === "THUMBNAIL_IMAGE"
        ? "thumbnail"
        : null
      : "originalFile";

  return (
    <div>
      <div className="mb-3">
        <FileView
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
        />
      </div>
      <div className="container">
        <div className="mb-3 metadata-caption">
          <strong>
            <DinaMessage id="field_acCaption" />:
          </strong>
          {` ${metadata.acCaption}`}
        </div>
      </div>
    </div>
  );
}
