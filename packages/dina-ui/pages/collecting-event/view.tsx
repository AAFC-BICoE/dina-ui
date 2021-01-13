import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { KitsuResponse } from "kitsu";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/objectstore-api/resources/CollectingEvent";
import { useContext, useState } from "react";
import { Person } from "packages/dina-ui/types/objectstore-api/resources/Person";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useContext(ApiClientContext);
  const [collectingEvent, setCollectingEvent] = useState<CollectingEvent>();

  const getAgents = (response: KitsuResponse<CollectingEvent, undefined>) => {
    if (response?.data?.collectors) {
      const fetchAgents = async () => {
        if (response?.data?.collectors) {
          return await bulkGet<Person>(
            response?.data?.collectors.map(
              collector => `/person/${collector.id}`
            ) as any,
            { apiBaseUrl: "/agent-api" }
          );
        }
      };
      const agents = fetchAgents();
      agents.then(async () => {
        response.data.collectors = await agents;
        setCollectingEvent(response.data);
      });
    }
  };

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="collecting-event" />
        <CancelButton
          entityId={id as string}
          entityLink="/collecting-event"
          byPassView={true}
        />
      </ButtonBar>
      <Query<CollectingEvent>
        query={{
          path: `collection-api/collecting-event/${id}?include=collectors`
        }}
        onSuccess={getAgents}
      >
        {({ loading }) => {
          if (collectingEvent && collectingEvent.createdOn) {
            const inUserTimeZone = new Date(
              collectingEvent.createdOn
            ).toString();
            collectingEvent.createdOn = inUserTimeZone;
          }

          return (
            <main className="container-fluid">
              <h1>
                <DinaMessage id="collectingEventViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {collectingEvent && (
                <Formik<CollectingEvent>
                  initialValues={collectingEvent}
                  onSubmit={noop}
                >
                  <div>
                    <div className="row">
                      <FieldView
                        className="col-md-2"
                        name="startEventDateTime"
                        label={formatMessage("startEventDateTimeLabel")}
                      />
                      {collectingEvent.endEventDateTime && (
                        <FieldView
                          className="col-md-2"
                          name="endEventDateTime"
                          label={formatMessage("endEventDateTimeLabel")}
                        />
                      )}
                      <FieldView
                        className="col-md-3"
                        name="verbatimEventDateTime"
                        label={formatMessage("verbatimEventDateTimeLabel")}
                      />
                    </div>
                    <div className="row">
                      <FieldView className="col-md-2" name="collectors" />
                    </div>
                  </div>
                </Formik>
              )}
            </main>
          );
        }}
      </Query>
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
