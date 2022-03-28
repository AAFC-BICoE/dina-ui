import {  useAccount } from "common-ui";
import { useRouter } from "next/router";

export default function MetadataImagePreviewPage() {
  const { token } = useAccount();
  const router = useRouter();
  const routerPath = router.asPath;
  const filePathProperties = routerPath.split("?").at(-1);

  const fileBucket = filePathProperties?.split("&").at(0)?.split("=").at(1);
  const isDerivative = filePathProperties?.split("&").at(1)?.split("=").at(1);
  const fileId = filePathProperties?.split("&").at(2)?.split("=").at(1);
  
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
