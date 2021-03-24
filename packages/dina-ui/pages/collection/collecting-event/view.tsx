import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  EditButton,
  FieldView,
  useQuery,
  withResponse
} from "common-ui";
import { FieldArray } from "formik";
import { KitsuResponse } from "kitsu";
import { orderBy } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";
import { useContext } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Footer, GroupFieldView, Head, Nav } from "../../../components";
import { GeoReferenceAssertionRow } from "../../../components/collection/GeoReferenceAssertionRow";
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
            <DinaForm<CollectingEvent> initialValues={colEvent}>
              <div className="row">
                <GroupFieldView
                  className="col-md-2"
                  name="group"
                  label={formatMessage("field_group")}
                />
              </div>
              <div className="row">
                <div className="col-md-6">
                  <fieldset className="form-group border px-4 py-2">
                    <legend className="w-auto">
                      <DinaMessage id="collectingDateLegend" />
                    </legend>
                    <FieldView
                      name="startEventDateTime"
                      label={formatMessage("startEventDateTimeLabel")}
                    />
                    {colEvent.endEventDateTime && (
                      <FieldView
                        name="endEventDateTime"
                        label={formatMessage("endEventDateTimeLabel")}
                      />
                    )}
                    <FieldView
                      name="verbatimEventDateTime"
                      label={formatMessage("verbatimEventDateTimeLabel")}
                    />
                  </fieldset>
                </div>
                <div className="col-md-6">
                  <fieldset className="form-group border px-4 py-2">
                    <legend className="w-auto">
                      <DinaMessage id="collectingAgentsLegend" />
                    </legend>
                    <FieldView name="dwcRecordedBy" />
                    <FieldView name="collectors" />
                    <FieldView name="dwcRecordNumber" />
                    <FieldView name="dwcOtherRecordNumbers" />
                  </fieldset>
                </div>
              </div>
              <fieldset className="form-group border px-4 py-2">
                <legend className="w-auto">
                  <DinaMessage id="collectingLocationLegend" />
                </legend>
                <fieldset className="form-group border px-4 py-2">
                  <legend className="w-auto">
                    <DinaMessage id="verbatimCoordinatesLegend" />
                  </legend>
                  <FieldView name="dwcVerbatimLocality" />
                  <div className="row">
                    <div className="col-md-6">
                      <FieldView name="dwcVerbatimLatitude" />
                      <FieldView name="dwcVerbatimLongitude" />
                    </div>
                    <div className="col-md-6">
                      <FieldView name="dwcVerbatimCoordinates" />
                      <FieldView name="dwcVerbatimCoordinateSystem" />
                      <FieldView name="dwcVerbatimSRS" />
                      <FieldView name="dwcVerbatimElevation" />
                      <FieldView name="dwcVerbatimDepth" />
                    </div>
                  </div>
                </fieldset>
                <div className="row">
                  <div className="col-md-6">
                    <fieldset className="form-group border px-4 py-2">
                      <legend className="w-auto">
                        <DinaMessage id="geoReferencingLegend" />
                      </legend>
                      <FieldArray name="geoReferenceAssertions">
                        {({ form }) => {
                          const assertions =
                            (form.values as CollectingEvent)
                              .geoReferenceAssertions ?? [];

                          return (
                            <Tabs>
                              <TabList>
                                {assertions.length
                                  ? assertions.map((assertion, index) => (
                                      <Tab key={assertion.id}>
                                        <span className="m-3">{index + 1}</span>
                                      </Tab>
                                    ))
                                  : null}
                              </TabList>
                              {assertions.length
                                ? assertions.map((assertion, index) => (
                                    <TabPanel key={assertion.id}>
                                      <GeoReferenceAssertionRow
                                        index={index}
                                        viewOnly={true}
                                      />
                                    </TabPanel>
                                  ))
                                : null}
                            </Tabs>
                          );
                        }}
                      </FieldArray>
                    </fieldset>
                  </div>
                  <div className="col-md-6">
                    <fieldset className="form-group border px-4 py-2">
                      <legend className="w-auto">
                        <DinaMessage id="toponymyLegend" />
                      </legend>
                      <FieldView name="geographicPlaceName" />
                      <FieldView name="dwcStateProvince" />
                      <FieldView name="dwcCountry" />
                    </fieldset>
                  </div>
                </div>
              </fieldset>
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
