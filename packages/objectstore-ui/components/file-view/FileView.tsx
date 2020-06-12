import { useAccount } from "common-ui";
import dynamic from "next/dynamic";
import { ComponentType } from "react";

export interface FileViewProps {
  clickToDownload?: boolean;
  filePath: string;
  fileType: string;
  imgAlt?: string;
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

export function FileView({
  clickToDownload,
  filePath,
  fileType,
  imgAlt
}: FileViewProps) {
  const { token } = useAccount();

  // Add the auth token to the requested file path:
  const authenticatedFilePath = `${filePath}?access_token=${token}`;

  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());

  if (!token) {
    return null;
  }

  const fileView = (
    <div className="file-viewer-wrapper">
      {isImage ? (
        <img
          alt={imgAlt}
          src={authenticatedFilePath}
          style={{
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
          }}
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
      )}
    </div>
  );

  return clickToDownload ? (
    <a
      href={authenticatedFilePath}
      style={{ color: "inherit", textDecoration: "none" }}
    >
      {fileView}
    </a>
  ) : (
    fileView
  );
}
