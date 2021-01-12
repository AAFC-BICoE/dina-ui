import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  EditButton,
  FieldView,
  useQuery,
  withResponse
} from "common-ui";
import { Formik } from "formik";
import { KitsuResource } from "kitsu";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { useContext } from "react";
import { Footer, Head, Nav } from "../../components";
import { AttachmentList } from "../../components/object-store/attachment-list/AttachmentList";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/objectstore-api/resources/CollectingEvent";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const collectingEventQuery = useQuery<CollectingEvent>({
    path: `collection-api/collecting-event/${id}`,
    include: "attachment"
  });

  const {
    attachMetadatasToCollectingEvent,
    detachMetadataIds
  } = useAttachMetadatasToCollectingEvent();

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />
      {withResponse(collectingEventQuery, ({ data: collectingEvent }) => {
        if (collectingEvent.createdOn) {
          const inUserTimeZone = new Date(collectingEvent.createdOn).toString();
          collectingEvent.createdOn = inUserTimeZone;
        }

        return (
          <main className="container-fluid">
            <h1>
              <DinaMessage id="collectingEventViewTitle" />
            </h1>
            <div>
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
                </div>
              </Formik>
              <div className="form-group">
                <div className="row">
                  <div className="col-md-6">
                    <AttachmentList
                      attachmentPath={`collection-api/collecting-event/${id}/attachment`}
                      onDetachMetadataIds={metadataIds =>
                        detachMetadataIds(metadataIds, collectingEvent)
                      }
                      afterMetadatasSaved={metadataIds =>
                        attachMetadatasToCollectingEvent(
                          metadataIds,
                          collectingEvent
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        );
      })}
      <Footer />
    </div>
  );
}

export function useAttachMetadatasToCollectingEvent() {
  const { save } = useContext(ApiClientContext);

  async function attachMetadatasToCollectingEvent(
    metadataIds: string[],
    collectingEvent: CollectingEvent
  ) {
    if (!collectingEvent?.attachment) {
      // Shouldn't happen because the attachment list should be present.
      return;
    }
    const newAttachmentList = [
      ...(collectingEvent.attachment ?? []),
      ...metadataIds
    ];

    const collectingEventUpdate: KitsuResource & Partial<CollectingEvent> = {
      id: collectingEvent.id,
      type: "collecting-event",
      attachment: newAttachmentList
    };

    await save(
      [
        {
          resource: collectingEventUpdate,
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  }

  async function detachMetadataIds(
    metadataIds: string[],
    collectingEvent: CollectingEvent
  ) {
    if (!collectingEvent?.attachment) {
      // Shouldn't happen because the attachment list should be present.
      return;
    }

    const newAttachmentList = collectingEvent.attachment.filter(
      existingId => !metadataIds.includes(existingId)
    );

    const collectingEventUpdate: KitsuResource & Partial<CollectingEvent> = {
      id: collectingEvent.id,
      type: "collecting-event",
      attachment: newAttachmentList
    };

    await save(
      [
        {
          resource: collectingEventUpdate,
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  }

  return { attachMetadatasToCollectingEvent, detachMetadataIds };
}

export default withRouter(CollectingEventDetailsPage);
