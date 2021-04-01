import {
  ApiClientContext,
  BackButton,
  ButtonBar,
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
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";
import { useContext } from "react";
import { Footer, Head, Nav } from "../../../components";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import { CollectingEventFormLayout } from "./edit";

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

    if (response?.data?.geoReferenceAssertions) {
      // Retrieve georeferenceAssertion with georeferencedBy
      const geoReferenceAssertions = await bulkGet<GeoReferenceAssertion>(
        response?.data?.geoReferenceAssertions.map(
          it => `/georeference-assertion/${it.id}?include=georeferencedBy`
        ),
        { apiBaseUrl: "/collection-api", returnNullForMissingResource: true }
      );

      // Retrieve georeferencedBy associated agents
      let agentBulkGetArgs: string[];
      agentBulkGetArgs = [];
      geoReferenceAssertions.forEach(async assert => {
        if (assert.georeferencedBy) {
          agentBulkGetArgs = agentBulkGetArgs.concat(
            assert.georeferencedBy.map(it => `/person/${it.id}`)
          );
        }
      });

      const agents = await bulkGet<Person>(agentBulkGetArgs, {
        apiBaseUrl: "/agent-api",
        returnNullForMissingResource: true
      });

      geoReferenceAssertions.forEach(assert => {
        const refers = assert.georeferencedBy;
        refers?.map(refer => {
          const index = assert.georeferencedBy?.findIndex(
            it => it.id === refer.id
          );
          const agent = agents.filter(it => it.id === refer.id)?.[0];
          if (assert.georeferencedBy !== undefined && index !== undefined) {
            assert.georeferencedBy[index] = agent;
          }
        });
      });
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

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton
          entityId={id as string}
          entityLink="collection/collecting-event"
        />
        <Link href={`/collection/collecting-event/revisions?id=${id}`}>
          <a className="btn btn-info">
            <DinaMessage id="revisionsButtonText" />
          </a>
        </Link>
        <BackButton
          entityId={id as string}
          entityLink="/collection/collecting-event"
          byPassView={true}
        />
      </ButtonBar>
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
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
