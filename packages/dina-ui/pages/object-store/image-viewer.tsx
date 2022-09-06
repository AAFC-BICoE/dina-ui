import { useAccount } from "common-ui";
import { useRouter } from "next/router";

export default function MetadataImagePreviewPage() {
  const { getCurrentToken } = useAccount();
  const router = useRouter();

  const token = getCurrentToken();

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
