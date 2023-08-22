import { LoadingSpinner, useApiClient, useQuery } from "../../../../common-ui";
import dynamic from "next/dynamic";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ComponentType, ReactNode, useState } from "react";
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

const IMG_TAG_SUPPORTED_FORMATS = [
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
  const [objectURL, setObjectURL] = useState<string>();
  async function fetchObjectBlob(path) {
    return await apiClient.axios.get(path, {
      responseType: "blob"
    });
  }
  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(fileType.toLowerCase());

  const showFile = !isSpreadsheet;
  function onSuccess(response) {
    setObjectURL(window?.URL?.createObjectURL(response));
  }
  const resp = useQuery(
    { path: filePath, responseType: "blob" },
    { onSuccess }
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
      } catch (error) {
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
    return (
      <div>
        {thumbnailImageDerivative ? (
          <SmallThumbnail filePath={fallBackFilePath} />
        ) : (
          <Link href={objectURL as any} passHref={true}>
            <a>{filePath}</a>
          </Link>
        )}
      </div>
    );
  }

  if (resp?.loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div className="file-viewer-wrapper text-center">
      {showFile ? (
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
          {showFile ? (
            isImage ? (
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
            )
          ) : null}
        </a>
      ) : (
        <DinaMessage id="previewNotAvailable" />
      )}
      {!preview && (
        <div className="d-flex justify-content-center">
          {downloadLinks?.original && (
            <a
              className="p-2 original"
              style={{ cursor: "pointer" }}
              onClick={() => handleDownloadLink(downloadLinks?.original)}
            >
              <DinaMessage id="originalFile" />
            </a>
          )}
          {downloadLinks?.thumbNail && (
            <a
              className="p-2 thumbnail"
              style={{ cursor: "pointer" }}
              onClick={() => handleDownloadLink(downloadLinks?.thumbNail)}
            >
              <DinaMessage id="thumbnail" />
            </a>
          )}
          {downloadLinks?.largeData && (
            <a
              className="p-2 large"
              style={{ cursor: "pointer" }}
              onClick={() => handleDownloadLink(downloadLinks?.largeData)}
            >
              <DinaMessage id="largeImg" />
            </a>
          )}
        </div>
      )}
      {!preview && <div>{showFile && shownTypeIndicator}</div>}
    </div>
  );
}
