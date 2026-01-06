import {
  LoadingSpinner,
  useApiClient,
  useBlobLoad,
  useIsVisible
} from "../../../../common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ReactNode, useState, useRef } from "react";
import { Metadata, Derivative } from "../../../types/objectstore-api";
import {
  derivativeTypeToLabel,
  handleDownloadLink
} from "../object-store-utils";
import RcTooltip from "rc-tooltip";
import { DownloadButton } from "../derivative-list/DerivativeList";
import { Badge, Dropdown } from "react-bootstrap";
import {
  FaDownload,
  FaFile,
  FaFileAudio,
  FaFileCsv,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
  FaFileZipper
} from "react-icons/fa6";
import { FaFileCode } from "react-icons/fa";
import { MdOutlineRawOn } from "react-icons/md";
import { IconType } from "react-icons/lib";
import { PDFViewer } from "./PDFViewer";
import { formatBytes } from "../object-store-utils";

export type DownLoadLinks = {
  original?: string;
  thumbNail?: string;
  largeData?: string;
};
export interface FileViewProps {
  clickToDownload?: boolean;
  filePath: string;
  fileType: string;
  caption?: string;
  imgAlt?: string;
  imgHeight?: string;
  downloadLinks?: DownLoadLinks;
  shownTypeIndicator?: ReactNode;
  hideDownload?: boolean;
  metadata?: Metadata | Derivative;
}

export const IMG_TAG_SUPPORTED_FORMATS = [
  "apng",
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "pdf"
];

export function FileView({
  clickToDownload,
  filePath,
  fileType,
  caption,
  imgAlt,
  imgHeight,
  downloadLinks,
  shownTypeIndicator,
  hideDownload,
  metadata
}: FileViewProps) {
  const { apiClient } = useApiClient();
  const { formatMessage, messages } = useDinaIntl();

  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType?.toLowerCase());
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const visibleRef = useRef<HTMLDivElement>(null);

  const isVisible = useIsVisible({
    ref: visibleRef,
    doNotReset: true,
    // Start loading images when it's 300px below the view port.
    offset: "0px 0px 300px 0px"
  });

  const disableRequest = () => {
    // Check if it's visible to the user, if not, then disable the request.
    if (isVisible === false) {
      return true;
    }

    // It's visible and the metadata is an image.
    return false;
  };

  const { objectUrl, error, isLoading } = useBlobLoad({
    filePath: filePath,
    autoOpen: false,
    disabled: disableRequest()
  });

  const errorStatus = (error as any)?.cause?.status;
  const objectUpload = (metadata as any)?.objectUpload;

  const filePathContents = filePath.split("/");

  // Generate the image viewer url using the current displayed image's filepath.
  const imageViewerUrl = filePathContents.includes("derivative")
    ? `/object-store/object/image-view?id=${filePathContents[5]}`
    : `/object-store/object/image-view?id=${filePathContents[4]}`;

  return (
    <div className="file-viewer-wrapper text-center" ref={visibleRef}>
      {isLoading ? (
        <LoadingSpinner loading={true} />
      ) : (
        <>
          {isImage ? (
            errorStatus === undefined ? (
              fileType === "pdf" ? (
                <PDFViewer
                  objectUrl={objectUrl as any}
                  shownTypeIndicator={shownTypeIndicator as any}
                />
              ) : (
                <a
                  href={imageViewerUrl as any}
                  target="_blank"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    pointerEvents:
                      clickToDownload && fileType != "pdf" ? undefined : "none",
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto",
                    width: "fit-content"
                  }}
                >
                  <RcTooltip
                    overlay={<>{shownTypeIndicator}</>}
                    placement="top"
                    align={{
                      points: ["bc", "bc"],
                      offset: [0, -20]
                    }}
                    motion={{
                      motionName: "rc-tooltip-zoom",
                      motionAppear: true,
                      motionEnter: true,
                      motionLeave: true
                    }}
                  >
                    <img
                      alt={imgAlt ?? `File path : ${filePath}`}
                      src={objectUrl as any}
                      style={{ maxHeight: imgHeight }}
                      onError={(event) =>
                        (event.currentTarget.style.display = "none")
                      }
                    />
                  </RcTooltip>
                </a>
              )
            ) : errorStatus === 403 ? (
              <DinaMessage id="unauthorized" />
            ) : (
              <DinaMessage id="thumbnailNotAvailableText" />
            )
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "3/2",
                backgroundColor: "#f0f0f0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ddd",
                borderRadius: "4px",
                color: "#666"
              }}
            >
              {fileExtensionToIcon(
                metadata?.fileExtension,
                "dropdown-icon mb-2"
              )}
              <DinaMessage id="previewNotAvailable" />
            </div>
          )}
          {caption && (
            <strong style={{ display: "block", marginTop: "10px" }}>
              {caption}
            </strong>
          )}

          {!hideDownload && errorStatus != 403 && downloadLinks?.original && (
            <>
              {metadata?.type != "derivative" &&
              metadata?.derivatives &&
              metadata?.derivatives?.length === 0 ? (
                <>
                  <div className="d-flex justify-content-center">
                    {downloadLinks?.original && (
                      <DownloadButton
                        id="downloadFile"
                        path={downloadLinks?.original}
                        isDownloading={isDownloading}
                        handleDownloadLink={handleDownloadLink}
                        apiClient={apiClient}
                        setIsDownloading={setIsDownloading}
                        classname="p-2 mt-3"
                      />
                    )}
                  </div>
                </>
              ) : (
                <Dropdown>
                  <Dropdown.Toggle
                    variant="primary"
                    id="dropdown-basic"
                    className="mt-3"
                  >
                    <FaDownload className="me-2" />
                    <DinaMessage id={"downloadFile"} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {downloadLinks?.original && (
                      <Dropdown.Item
                        as="button"
                        className="d-flex justify-content-between align-items-center"
                        onClick={() =>
                          handleDownloadLink(
                            downloadLinks?.original ?? "",
                            apiClient,
                            setIsDownloading
                          )
                        }
                      >
                        <div
                          className="d-flex align-items-center"
                          style={{ minWidth: "250px" }}
                        >
                          {fileExtensionToIcon(
                            metadata?.fileExtension,
                            "me-3 text-secondary dropdown-icon"
                          )}
                          <div>
                            <div className="fw-semibold">
                              {formatMessage("originalFile")}
                            </div>
                            <small className="text-muted">
                              {metadata?.fileExtension?.toUpperCase()}
                            </small>
                          </div>

                          {objectUpload && (
                            <Badge
                              bg="light"
                              text="dark"
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.35em 0.5em",
                                marginLeft: "auto"
                              }}
                            >
                              {formatBytes(objectUpload.sizeInBytes)}
                            </Badge>
                          )}
                        </div>
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    {metadata?.type !== "derivative" &&
                      metadata?.derivatives?.map((derivative) => {
                        const fileIdentifier = derivative.fileIdentifier;
                        const bucket = derivative.bucket;
                        const fileType = derivative.fileExtension;
                        const derivativeType = derivative.derivativeType;
                        const filePath = `/objectstore-api/file/${bucket}/derivative/${fileIdentifier}`;
                        const fileSize = (derivative as any).objectUpload
                          ?.sizeInBytes;

                        return (
                          <Dropdown.Item
                            key={fileIdentifier}
                            as="button"
                            className="d-flex justify-content-between align-items-center"
                            onClick={() =>
                              handleDownloadLink(
                                filePath,
                                apiClient,
                                setIsDownloading
                              )
                            }
                          >
                            <div className="d-flex align-items-center">
                              {fileExtensionToIcon(
                                fileType,
                                "me-3 text-secondary dropdown-icon"
                              )}
                              <div>
                                <div className="fw-semibold">
                                  {derivativeTypeToLabel(
                                    derivativeType,
                                    messages
                                  )}
                                </div>
                                <small className="text-muted">
                                  {fileType.toUpperCase()}
                                </small>
                              </div>
                              {fileSize && (
                                <Badge
                                  bg="light"
                                  text="dark"
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "0.35em 0.5em",
                                    marginLeft: "2em"
                                  }}
                                >
                                  {formatBytes(fileSize)}
                                </Badge>
                              )}
                            </div>
                          </Dropdown.Item>
                        );
                      })}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </>
          )}

          {!hideDownload &&
            errorStatus != 403 &&
            metadata?.type === "derivative" && (
              <>
                {downloadLinks?.thumbNail ? (
                  <div className="d-flex justify-content-center">
                    <DownloadButton
                      id="downloadFile"
                      path={downloadLinks?.thumbNail}
                      isDownloading={isDownloading}
                      handleDownloadLink={handleDownloadLink}
                      apiClient={apiClient}
                      setIsDownloading={setIsDownloading}
                      classname="p-2 mt-3"
                    />
                  </div>
                ) : downloadLinks?.largeData ? (
                  <div className="d-flex justify-content-center">
                    <DownloadButton
                      id="downloadFile"
                      path={downloadLinks?.largeData}
                      isDownloading={isDownloading}
                      handleDownloadLink={handleDownloadLink}
                      apiClient={apiClient}
                      setIsDownloading={setIsDownloading}
                      classname="p-2 mt-3"
                    />
                  </div>
                ) : null}
              </>
            )}
        </>
      )}
    </div>
  );
}

// Raw‐format extensions
const RAW_EXTS = new Set(["cr2", "nef"]);

// Common media groups
const IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "svg",
  "webp"
]);
const VIDEO_EXTS = new Set(["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "flac", "aac", "ogg", "m4a"]);

// Specific one‐off mapping (extension → icon)
const SPECIFIC_ICON_MAP: Record<string, IconType> = {
  pdf: FaFilePdf,
  doc: FaFileWord,
  docx: FaFileWord,
  xls: FaFileExcel,
  xlsx: FaFileExcel,
  csv: FaFileCsv,
  html: FaFileCode,
  htm: FaFileCode,
  ppt: FaFilePowerpoint,
  pptx: FaFilePowerpoint,
  zip: FaFileZipper,
  gz: FaFileZipper,
  gzip: FaFileZipper
};

/**
 * Render an appropriate file‐icon based on a “.ext” string.
 *
 * @param fileExtension  The extension, e.g. ".jpg", ".PDF", ".Cr2"
 * @param className      CSS className to pass to the icon
 */
export function fileExtensionToIcon(
  fileExtension: string | undefined,
  className = ""
): React.ReactNode {
  if (!fileExtension) return null;

  // strip leading dot and lowercase
  const ext = fileExtension.replace(/^\./, "").toLowerCase();

  if (RAW_EXTS.has(ext)) {
    return <MdOutlineRawOn className={className} />;
  }
  if (IMAGE_EXTS.has(ext)) {
    return <FaFileImage className={className} />;
  }
  if (VIDEO_EXTS.has(ext)) {
    return <FaFileVideo className={className} />;
  }
  if (AUDIO_EXTS.has(ext)) {
    return <FaFileAudio className={className} />;
  }
  if (SPECIFIC_ICON_MAP[ext]) {
    const Icon = SPECIFIC_ICON_MAP[ext];
    return <Icon className={className} />;
  }

  // Default to generic file icon
  return <FaFile className={className} />;
}
