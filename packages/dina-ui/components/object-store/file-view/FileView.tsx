import { LoadingSpinner, useApiClient, useQuery } from "../../../../common-ui";
import dynamic from "next/dynamic";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ComponentType, ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { SmallThumbnail } from "../../table/thumbnail-cell";
import { Metadata } from "../../../types/objectstore-api";

export type DownLoadLinks = {
  original?: string;
  thumbNail?: string;
  largeData?: string;
};

export interface FileViewProps {
  clickToDownload?: boolean;
  filePath: string;
  fileType: string;
  imgAlt?: string;
  imgHeight?: string;
  downloadLinks?: DownLoadLinks;
  shownTypeIndicator?: ReactNode;
  preview?: boolean;
  metadata?: Metadata;
}

// The FileViewer component can't be server-side rendered:
const FileViewer: ComponentType<any> = dynamic(
  () => import("react-file-viewer"),
  { ssr: false }
);

export const IMG_TAG_SUPPORTED_FORMATS = [
  "apng",
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg"
];

const SPREADSHEET_FORMATS = ["ods", "xls", "xlsm", "xlsx", "csv"];

export function FileView({
  clickToDownload,
  filePath,
  fileType,
  imgAlt,
  imgHeight,
  downloadLinks,
  shownTypeIndicator,
  preview,
  metadata
}: FileViewProps) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const [objectURL, setObjectURL] = useState<string>();
  async function fetchObjectBlob(path) {
    return await apiClient.axios.get(path, {
      responseType: "blob",
      timeout: 0
    });
  }
  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(fileType.toLowerCase());
  const [isFallbackRender, setIsFallBackRender] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const shownTypeIndicatorFallback = (
    <div className="shown-file-type">
      <strong>
        <DinaMessage id="showing" />:
      </strong>
      {` ${formatMessage("thumbnail")}`}
    </div>
  );
  const showFile = !isSpreadsheet;
  function onSuccess(response) {
    setObjectURL(window?.URL?.createObjectURL(response));
  }
  const resp = useQuery(
    { path: filePath, responseType: "blob", timeout: 0 },
    {
      onSuccess,
      disabled: metadata
        ? metadata?.dcType !== "IMAGE" && metadata?.dcType !== "MOVING_IMAGE"
        : false
    }
  );

  if (preview || (!isImage && fileType !== "pdf")) {
    clickToDownload = false;
  }

  /**
   * When the user clicks a download link, the current token will be appended.
   *
   * @param path The download link.
   */
  async function handleDownloadLink(path?: string) {
    if (path) {
      try {
        setIsDownloading(true);
        const response = await fetchObjectBlob(path);
        const url = window?.URL?.createObjectURL(response.data);
        const link = document?.createElement("a");
        const content: string = response.headers["content-disposition"];
        const filename = content
          .slice(content.indexOf("filename=") + "filename=".length)
          .replaceAll('"', "");
        link.href = url;
        link?.setAttribute("download", filename); // or any other extension
        document?.body?.appendChild(link);
        link?.click();
        window?.URL?.revokeObjectURL(url);
        setIsDownloading(false);
      } catch (error) {
        setIsDownloading(false);
        return error;
      }
    }
  }

  function fallBackRender() {
    const thumbnailImageDerivative = metadata?.derivatives?.find(
      (it) => it.derivativeType === "THUMBNAIL_IMAGE"
    );
    const fileId = thumbnailImageDerivative?.fileIdentifier;
    const fallBackFilePath = `/objectstore-api/file/${
      thumbnailImageDerivative?.bucket
    }/${
      // Add derivative/ before the fileIdentifier if the file to display is a derivative.
      thumbnailImageDerivative?.type === "derivative" ? "derivative/" : ""
    }${fileId}`;
    if (thumbnailImageDerivative) {
      setIsFallBackRender(true);
    }
    return (
      <div>
        {thumbnailImageDerivative ? (
          <SmallThumbnail filePath={fallBackFilePath} />
        ) : (
          <Link
            href={objectURL ? (objectURL as any) : filePath}
            passHref={true}
          >
            <a>{filePath}</a>
          </Link>
        )}
      </div>
    );
  }

  if (resp?.loading) {
    return <LoadingSpinner loading={true} />;
  }
  const errorStatus = (resp.error as any)?.cause?.status;

  return (
    <div className="file-viewer-wrapper text-center">
      {showFile ? (
        errorStatus === undefined ? (
          <a
            href={objectURL}
            target="_blank"
            style={{
              color: "inherit",
              textDecoration: "none",
              pointerEvents: clickToDownload ? undefined : "none",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              width: "fit-content"
            }}
          >
            {isImage ? (
              <img
                alt={imgAlt ?? `File path : ${filePath}`}
                src={objectURL}
                style={{ height: imgHeight }}
                onError={(event) =>
                  (event.currentTarget.style.display = "none")
                }
              />
            ) : (
              <FileViewer
                filePath={objectURL}
                fileType={fileType}
                unsupportedComponent={fallBackRender}
                errorComponent={fallBackRender}
              />
            )}
          </a>
        ) : errorStatus === 403 ? (
          <DinaMessage id="unauthorized" />
        ) : (
          <DinaMessage id="thumbnailNotAvailableText" />
        )
      ) : (
        <DinaMessage id="previewNotAvailable" />
      )}
      {!preview && (
        <div className="d-flex justify-content-center">
          {downloadLinks?.original && (
            <DownloadLink
              id="originalFile"
              path={downloadLinks?.original}
              isDownloading={isDownloading}
              handleDownloadLink={handleDownloadLink}
            />
          )}
          {downloadLinks?.thumbNail && (
            <DownloadLink
              id="thumbnail"
              path={downloadLinks?.thumbNail}
              isDownloading={isDownloading}
              handleDownloadLink={handleDownloadLink}
            />
          )}
          {downloadLinks?.largeData && (
            <DownloadLink
              id="largeImg"
              path={downloadLinks?.largeData}
              isDownloading={isDownloading}
              handleDownloadLink={handleDownloadLink}
            />
          )}
        </div>
      )}
      {!preview && (
        <div>
          {showFile &&
            (isFallbackRender
              ? shownTypeIndicatorFallback
              : shownTypeIndicator)}
        </div>
      )}
    </div>
  );
}

interface DownloadLinkProps {
  id: string;
  path: string;
  isDownloading: boolean;
  handleDownloadLink: (path?: string) => Promise<any>;
}
function DownloadLink({
  id,
  path,
  isDownloading,
  handleDownloadLink
}: DownloadLinkProps) {
  return isDownloading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <a
      className="p-2 original"
      style={{ cursor: "pointer" }}
      onClick={() => handleDownloadLink(path)}
    >
      <DinaMessage id={id as any} />
    </a>
  );
}
