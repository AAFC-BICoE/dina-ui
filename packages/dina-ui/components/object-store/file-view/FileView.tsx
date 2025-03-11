import {
  LoadingSpinner,
  useApiClient,
  useIsVisible,
  useQuery
} from "../../../../common-ui";
import dynamic from "next/dynamic";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ComponentType,
  ReactNode,
  useState,
  useRef,
  Dispatch,
  SetStateAction
} from "react";
import Link from "next/link";
import { SmallThumbnail } from "../../table/thumbnail-cell";
import { Metadata } from "../../../types/objectstore-api";
import Kitsu from "kitsu";
import { handleDownloadLink } from "../object-store-utils";

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

const DOCUMENT_FORMATS = ["doc", "docx", "pdf"];

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

  const isImage = IMG_TAG_SUPPORTED_FORMATS.includes(fileType.toLowerCase());
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(fileType.toLowerCase());
  const isTextDoc = DOCUMENT_FORMATS.includes(fileType.toLowerCase());
  const [isFallbackRender, setIsFallBackRender] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const visibleRef = useRef<HTMLDivElement>(null);

  const isVisible = useIsVisible({
    ref: visibleRef,
    doNotReset: true,
    // Start loading images when it's 300px below the view port.
    offset: "0px 0px 300px 0px"
  });

  const shownTypeIndicatorFallback = (
    <div className="shown-file-type">
      <strong>
        <DinaMessage id="showing" />:
      </strong>
      {` ${formatMessage("thumbnail")}`}
    </div>
  );
  const showFile = !(isSpreadsheet || isTextDoc);

  function onSuccess(response) {
    setObjectURL(window?.URL?.createObjectURL(response));
  }

  const disableRequest = () => {
    // Check if it's visible to the user, if not, then disable the request.
    if (isVisible === false) {
      return true;
    }

    // Check if it's something that can be loaded...
    if (metadata) {
      return (
        metadata?.dcType !== "IMAGE" && metadata?.dcType !== "MOVING_IMAGE"
      );
    }

    // It's visible and the metadata is an image.
    return false;
  };

  const resp = useQuery(
    { path: filePath, responseType: "blob", timeout: 0 },
    {
      onSuccess,
      disabled: disableRequest()
    }
  );

  if (preview || (!isImage && fileType !== "pdf")) {
    clickToDownload = false;
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

  const errorStatus = (resp.error as any)?.cause?.status;
  return (
    <div className="file-viewer-wrapper text-center" ref={visibleRef}>
      {resp?.loading ? (
        <LoadingSpinner loading={true} />
      ) : (
        <>
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
                  apiClient={apiClient}
                  setIsDownloading={setIsDownloading}
                />
              )}
              {downloadLinks?.thumbNail && (
                <DownloadLink
                  id="thumbnail"
                  path={downloadLinks?.thumbNail}
                  isDownloading={isDownloading}
                  handleDownloadLink={handleDownloadLink}
                  apiClient={apiClient}
                  setIsDownloading={setIsDownloading}
                />
              )}
              {downloadLinks?.largeData && (
                <DownloadLink
                  id="largeImg"
                  path={downloadLinks?.largeData}
                  isDownloading={isDownloading}
                  handleDownloadLink={handleDownloadLink}
                  apiClient={apiClient}
                  setIsDownloading={setIsDownloading}
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
        </>
      )}
    </div>
  );
}

interface DownloadLinkProps {
  id: string;
  path: string;
  isDownloading: boolean;
  handleDownloadLink: (
    path: string,
    apiClient: Kitsu,
    setIsDownloading: Dispatch<SetStateAction<boolean>>
  ) => Promise<any>;
  apiClient: Kitsu;
  setIsDownloading: Dispatch<SetStateAction<boolean>>;
}
function DownloadLink({
  id,
  path,
  isDownloading,
  handleDownloadLink,
  apiClient,
  setIsDownloading
}: DownloadLinkProps) {
  return isDownloading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <a
      className="p-2 original"
      style={{ cursor: "pointer" }}
      onClick={() => handleDownloadLink(path, apiClient, setIsDownloading)}
    >
      <DinaMessage id={id as any} />
    </a>
  );
}
