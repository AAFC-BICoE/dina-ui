import { useAccount } from "common-ui";
import { useRouter } from "next/router";
import { ComponentType, useEffect, useState } from "react";
import dynamic from "next/dynamic";

export default function MetadataImagePreviewPage() {
  const { getCurrentToken } = useAccount();
  const router = useRouter();

  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function refreshToken() {
      const newToken = await getCurrentToken();
      setToken(newToken);
    }

    // Get the latest token for the preview.
    refreshToken();
  }, []);

  const fileBucket = router.query.bucket?.toString();
  const isDerivative = router.query.isDerivative?.toString() === "true";
  const fileId = router.query.fileId?.toString();
  const isImage = router.query.isImage?.toString() === "true";
  const fileType = router.query.fileType?.toString();
  const filePath = `/api/objectstore-api/file/${fileBucket}/${
    // Add derivative/ before the fileIdentifier if the file to display is a derivative.
    isDerivative ? "derivative/" : ""
  }${fileId}`;
  // The FileViewer component can't be server-side rendered:
  const FileViewer: ComponentType<any> = dynamic(
    () => import("react-file-viewer"),
    { ssr: false }
  );

  // Add the auth token to the requested file path:
  const authenticatedFilePath = `${filePath}?access_token=${token}`;
  return (
    <div>
      <main className="container-fluid">
        <div className="row">
          <div>
            {isImage ? (
              <img
                alt={`File path : ${filePath}`}
                src={authenticatedFilePath}
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
        </div>
      </main>
    </div>
  );
}
