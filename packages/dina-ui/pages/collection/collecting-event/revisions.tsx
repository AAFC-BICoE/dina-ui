import { useQuery, withResponse } from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { COLLECTION_REVISION_ROW_CONFIG } from "packages/dina-ui/components/revisions/revision-row-configs/collection-revision-row-configs";
import { CollectingEvent } from "packages/dina-ui/types/collection-api/resources/CollectingEvent";
import { Footer, Head, Nav } from "../../../components";
import { RevisionsPageLayout } from "../../../components/revisions/RevisionsPageLayout";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export default function CollectingEventRevisionListPage() {
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const { id: collectingEventId } = router.query;

  const collectingEventQuery = useQuery<CollectingEvent>({
    path: `collection-api/collecting-event/${collectingEventId}`
  });

  return withResponse(collectingEventQuery, response => {
    const collectingEvent = response.data;

    const pageTitle = formatMessage("revisionsListTitle", {
      name: collectingEvent.dwcRecordedBy ?? collectingEventId?.toString()
    });

    return (
      <>
        <Head title={pageTitle} 
						  lang={formatMessage("languageOfPage")} 
						  creator={formatMessage("agricultureCanada")}
						  subject={formatMessage("subjectTermsForPage")} />
        <Nav />
        <main className="container-fluid">
          <h1 id="wb-cont">{pageTitle}</h1>
          <div className="mb-3">
            <Link
              href={`/collection/collecting-event/view?id=${collectingEvent.id}`}
            >
              <a>
                <DinaMessage id="detailsPageLink" />
              </a>
            </Link>
          </div>
          <RevisionsPageLayout
            auditSnapshotPath="collection-api/audit-snapshot"
            instanceId={`collecting-event/${collectingEventId}`}
            revisionRowConfigsByType={COLLECTION_REVISION_ROW_CONFIG}
          />
        </main>
        <Footer />
      </>
    );
  });
}
