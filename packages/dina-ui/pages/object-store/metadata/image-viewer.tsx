import {  useAccount } from "common-ui";
import { useRouter } from "next/router";

const OBJECT_DETAILS_PAGE_CSS = `
    .file-viewer-wrapper img {
      max-width: 100%;
      height: auto;
    }
  `;

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
      <style>{OBJECT_DETAILS_PAGE_CSS}</style>
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
