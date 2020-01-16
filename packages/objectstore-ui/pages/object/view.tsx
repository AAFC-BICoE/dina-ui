import { useRouter } from "next/router";
import { Head, Nav } from "../../components";
import { MetadataPreview } from "../../components/MetadataPreview";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper {
    height: 15rem;
  }
`;

export default function MetadataViewPage() {
  const router = useRouter();

  const { id } = router.query;

  if (!id) {
    return null;
  }

  return (
    <div>
      <Head title="Objects" />
      <Nav />
      <style>{OBJECT_DETAILS_PAGE_CSS}</style>
      <div className="container">
        <MetadataPreview metadataId={String(id)} />
      </div>
    </div>
  );
}
