import { LoadingSpinner } from "common-ui";
import { useRouter } from "next/router";
import { useMetadataQuery } from "../../../components/object-store";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";

const OBJECT_DETAILS_PAGE_CSS = `
    .file-viewer-wrapper img {
      max-width: 100%;
      height: auto;
    }
  `;

export default function MetadataImagePreviewPage() {
  const router = useRouter();

  const id = String(router.query.id);

  const { loading, response } = useMetadataQuery(id);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;
    const preview = true;
    return (
      <div>
        <style>{OBJECT_DETAILS_PAGE_CSS}</style>
        <main className="container-fluid">
          <div className="row">
            <div>
              <MetadataFileView metadata={metadata} id={id} preview={preview} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
