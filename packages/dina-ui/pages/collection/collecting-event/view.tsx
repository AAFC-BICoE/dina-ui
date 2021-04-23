import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse
} from "common-ui";
import { KitsuResponse } from "kitsu";
import { orderBy } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { useContext } from "react";
import { Footer, Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useContext(ApiClientContext);

  async function initOneToManyRelations(
    response: KitsuResponse<CollectingEvent, undefined>
  ) {
    if (response?.data?.collectors) {
      const agents = await bulkGet<Person>(
        response.data.collectors.map(collector => `/person/${collector.id}`),
        { apiBaseUrl: "/agent-api", returnNullForMissingResource: true }
      );
      // Omit null (deleted) records:
      response.data.collectors = agents.filter(it => it);
    }

    const geoReferenceAssertions = response?.data?.geoReferenceAssertions;
    if (geoReferenceAssertions) {
      // Retrieve georeferencedBy associated agents
      for (const assertion of geoReferenceAssertions) {
        if (assertion.georeferencedBy) {
          assertion.georeferencedBy = await bulkGet<Person>(
            assertion.georeferencedBy.map(personId => `/person/${personId}`),
            {
              apiBaseUrl: "/agent-api",
              returnNullForMissingResource: true
            }
          );
        }
      }

      response.data.geoReferenceAssertions = geoReferenceAssertions;
    }

    if (response?.data) {
      // Order GeoReferenceAssertions by "createdOn" ascending:
      response.data.geoReferenceAssertions = orderBy(
        response.data.geoReferenceAssertions,
        "createdOn"
      );
    }

    if (response?.data?.createdOn) {
      const inUserTimeZone = new Date(response.data.createdOn).toString();
      response.data.createdOn = inUserTimeZone;
    }
  }

  const collectingEventQuery = useQuery<CollectingEvent>(
    {
      path: `collection-api/collecting-event/${id}`,
      include: "attachment,collectors,geoReferenceAssertions"
    },
    { onSuccess: initOneToManyRelations }
  );

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/collecting-event"
        byPassView={true}
      />
      <EditButton
        className="ml-auto"
        entityId={id as string}
        entityLink="collection/collecting-event"
      />
      <Link href={`/collection/collecting-event/revisions?id=${id}`}>
        <a className="btn btn-info">
          <DinaMessage id="revisionsButtonText" />
        </a>
      </Link>
      <DeleteButton
        className="ml-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/collecting-event/list"
        type="collecting-event"
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />
      {buttonBar}
      {withResponse(collectingEventQuery, ({ data: colEvent }) => (
        <main className="container-fluid">
          <h1>
            <DinaMessage id="collectingEventViewTitle" />
          </h1>
          <div className="form-group">
            <DinaForm<CollectingEvent> initialValues={colEvent} readOnly={true}>
              <CollectingEventFormLayout />
            </DinaForm>
          </div>
          <div className="form-group">
            <AttachmentReadOnlySection
              attachmentPath={`collection-api/collecting-event/${id}/attachment`}
              detachTotalSelected={true}
            />
          </div>
        </main>
      ))}
      {buttonBar}
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
