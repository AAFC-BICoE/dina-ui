import {
  LoadingSpinner,
  useAccount,
  useApiClient,
  useQuery
} from "../../../../common-ui";
import dynamic from "next/dynamic";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ComponentType, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

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
  preview
}: FileViewProps) {
  const { apiClient } = useApiClient();
  const [imageURL, setImageURL] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  async function fetchImageBlob(path) {
    return await apiClient.axios.get(path, {
      responseType: "blob"
    });
  }

  useEffect(() => {
    async function fetchImageURL() {
      // axios post request
      try {
        const response = await fetchImageBlob(filePath);
        const data = window.URL.createObjectURL(response.data);
        setImageURL(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        return error;
      }
    }
    fetchImageURL();
  }, []);

  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(fileType.toLowerCase());

  const showFile = !isSpreadsheet;

  // split file path into array
  const filePathArray = filePath.split("/");

  // fileId is last element of array
  const fileId = filePathArray[filePathArray.length - 1];
  const isDerivative = filePath.includes("derivative").toString();
  const fileBucket = filePathArray[4];

  // build link to file-viewer page
  const fileViewerLink = `/object-store/file-viewer`;

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
        const response = await fetchImageBlob(path);
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", path); // or any other extension
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        return error;
      }
    }
  }

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div className="file-viewer-wrapper text-center">
      {showFile ? (
        <Link
          href={{
            pathname: fileViewerLink,
            query: {
              bucket: fileBucket,
              fileId,
              fileType,
              isDerivative,
              isImage
            }
          }}
        >
          <a
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
                  src={imageURL}
                  style={{ height: imgHeight }}
                  onError={(event) =>
                    (event.currentTarget.style.display = "none")
                  }
                />
              ) : (
                <FileViewer
                  filePath={imageURL}
                  fileType={fileType}
                  unsupportedComponent={() => (
                    <div>
                      {imageURL && (
                        <Link href={imageURL} passHref={true}>
                          <a>{filePath}</a>
                        </Link>
                      )}
                    </div>
                  )}
                />
              )
            ) : null}
          </a>
        </Link>
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
