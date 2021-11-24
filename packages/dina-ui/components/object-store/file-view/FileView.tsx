import { useAccount } from "common-ui";
import dynamic from "next/dynamic";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ComponentType, ReactNode } from "react";

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
  shownTypeIndicator
}: FileViewProps) {
  const { token } = useAccount();

  // Add the auth token to the requested file path:
  const authenticatedFilePath = `${filePath}?access_token=${token}`;

  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(fileType.toLowerCase());

  const showFile = !isSpreadsheet;

  if (!token) {
    return null;
  }

  return (
    <div className="file-viewer-wrapper text-center">
      {showFile ? (
        <a
          href={authenticatedFilePath}
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
                src={authenticatedFilePath}
                style={{ height: imgHeight }}
              />
            ) : (
              <FileViewer
                filePath={authenticatedFilePath}
                fileType={fileType}
                unsupportedComponent={() => (
                  <div>
                    <a href={authenticatedFilePath}>{filePath}</a>
                  </div>
                )}
              />
            )
          ) : null}
        </a>
      ) : (
        <DinaMessage id="previewNotAvailable" />
      )}
      <div className="d-flex justify-content-center">
        {downloadLinks?.original && (
          <a
            className="p-2 original"
            href={`${downloadLinks?.original}?access_token=${token}`}
          >
            <DinaMessage id="originalFile" />
          </a>
        )}
        {downloadLinks?.thumbNail && (
          <a
            className="p-2 thumbnail"
            href={`${downloadLinks?.thumbNail}?access_token=${token}`}
          >
            <DinaMessage id="thumbnail" />
          </a>
        )}
        {downloadLinks?.largeData && (
          <a
            className="p-2 large"
            href={`${downloadLinks?.largeData}?access_token=${token}`}
          >
            <DinaMessage id="largeImg" />
          </a>
        )}
      </div>
      <div>{showFile && shownTypeIndicator}</div>
    </div>
  );
}
