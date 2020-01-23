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

export function FileView({ filePath, fileType }: FileViewProps) {
  const isImage = ["jpg", "png"].includes(fileType);

  return (
    <div className="file-viewer-wrapper">
      {isImage ? (
        <img
          src={filePath}
          style={{
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
          }}
        />
      ) : (
        <FileViewer filePath={filePath} fileType={fileType} />
      )}
    </div>
  );
}
