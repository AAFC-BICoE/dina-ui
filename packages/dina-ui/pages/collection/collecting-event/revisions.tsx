import { useQuery, withResponse } from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { COLLECTION_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-row-configs/collection-revision-row-configs";
import { RevisionsPageLayout } from "../../../components/revisions/RevisionsPageLayout";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

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
        <Head title={pageTitle} />
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
