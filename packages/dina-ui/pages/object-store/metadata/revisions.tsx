import { useQuery, withResponse } from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { OBJECT_STORE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-row-configs/objectstore-revision-row-configs";
import { RevisionsPageLayout } from "../../../components/revisions/RevisionsPageLayout";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";

export default function MetadataRevisionListPage() {
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const { id: metadataId } = router.query;

  const metadataQuery = useQuery<Metadata>({
    path: `objectstore-api/metadata/${metadataId}`
  });

  return withResponse(metadataQuery, response => {
    const metadata = response.data;

    const pageTitle = formatMessage("revisionsListTitle", {
      name: metadata.originalFilename
    });

    return (
      <>
        <Head title={pageTitle} />
        <Nav />
        <main className="container-fluid">
          <h1>{pageTitle}</h1>
          <div className="form-group">
            <Link href={`/object-store/object/view?id=${metadata.id}`}>
              <a>
                <DinaMessage id="detailsPageLink" />
              </a>
            </Link>
          </div>
          <RevisionsPageLayout
            auditSnapshotPath="objectstore-api/audit-snapshot"
            instanceId={`metadata/${metadataId}`}
            revisionRowConfigsByType={OBJECT_STORE_REVISION_ROW_CONFIG}
          />
        </main>
        <Footer />
      </>
    );
  });
}
