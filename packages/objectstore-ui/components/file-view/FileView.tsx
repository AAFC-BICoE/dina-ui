import dynamic from "next/dynamic";
import { ComponentType } from "react";

interface FileViewProps {
  filePath: string;
  fileType: string;
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

export function FileView({ filePath, fileType }: FileViewProps) {
  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());

  return (
    <div className="file-viewer-wrapper">
      {isImage ? (
        <img
          alt=""
          src={filePath}
          style={{
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
          }}
        />
      ) : (
        <FileViewer
          filePath={filePath}
          fileType={fileType}
          unsupportedComponent={() => (
            <div>
              <a href={filePath}>{filePath}</a>
            </div>
          )}
        />
      )}
    </div>
  );
}
