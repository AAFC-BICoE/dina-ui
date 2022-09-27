import { useAccount } from "common-ui";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
  const isDerivative = router.query.isDerivative?.toString();
  const fileId = router.query.fileId?.toString();

  const filePath = `/api/objectstore-api/file/${fileBucket}/${
    // Add derivative/ before the fileIdentifier if the file to display is a derivative.
    isDerivative === "true" ? "derivative/" : ""
  }${fileId}`;

  // Add the auth token to the requested file path:
  const authenticatedFilePath = `${filePath}?access_token=${token}`;
  return (
    <div>
      <main className="container-fluid">
        <div className="row">
          <div>
            <img alt={`File path : ${filePath}`} src={authenticatedFilePath} />
          </div>
        </div>
      </main>
    </div>
  );
}
