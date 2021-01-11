import {
  ButtonBar,
  CancelButton,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { AttachmentList } from "../../components/object-store/attachment-list/AttachmentList";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/objectstore-api/resources/CollectingEvent";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />

      <Query<CollectingEvent>
        query={{ path: `collection-api/collecting-event/${id}` }}
      >
        {({ loading, response }) => {
          const collectingEvent = response && {
            ...response.data
          };

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
                    <div className="form-group">
                      <ButtonBar>
                        <EditButton
                          entityId={id as string}
                          entityLink="collecting-event"
                        />
                        <CancelButton
                          entityId={id as string}
                          entityLink="/collecting-event"
                          byPassView={true}
                        />
                      </ButtonBar>
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
                    </div>
                    <div className="form-group">
                      <div className="row">
                        <div className="col-md-6">
                          <AttachmentList
                            attachmentPath={`collection-api/collecting-event/${id}/attachment`}
                            postSaveRedirect={`/collecting-event/view?id=${id}`}
                          />
                        </div>
                      </div>
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
