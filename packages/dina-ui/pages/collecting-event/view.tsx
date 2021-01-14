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
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { PersistedResource } from "kitsu";
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
                        name="group"
                        label={formatMessage("field_group")}
                      />
                    </div>
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
                        detachMetadataIds(metadataIds, String(id))
                      }
                      afterMetadatasSaved={metadataIds =>
                        attachMetadatasToCollectingEvent(
                          metadataIds,
                          String(id)
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
  const { apiClient, doOperations } = useContext(ApiClientContext);

  async function attachMetadatasToCollectingEvent(
    metadataIds: string[],
    collectingEventId: string
  ) {
    const { data: collectingEvent } = await apiClient.get<CollectingEvent>(
      `collection-api/collecting-event/${collectingEventId}`,
      { include: "attachment" }
    );
    const newAttachmentList = [
      ...(collectingEvent.attachment ?? []),
      ...metadataIds.map(id => ({ id, type: "metadata" }))
    ];

    await updateCollectingEvent(collectingEvent.id, newAttachmentList);
  }

  async function detachMetadataIds(
    metadataIdsToDetach: string[],
    collectingEventId: string
  ) {
    const { data: collectingEvent } = await apiClient.get<CollectingEvent>(
      `collection-api/collecting-event/${collectingEventId}`,
      { include: "attachment" }
    );
    const newAttachmentList = (collectingEvent.attachment ?? []).filter(
      existingAttachment => !metadataIdsToDetach.includes(existingAttachment.id)
    );

    await updateCollectingEvent(collectingEvent.id, newAttachmentList);
  }

  async function updateCollectingEvent(
    id: string,
    newAttachmentsList: ResourceIdentifierObject[]
  ) {
    await doOperations(
      [
        {
          op: "PATCH",
          path: `collecting-event/${id}`,
          value: {
            id,
            type: "collecting-event",
            relationships: {
              attachment: { data: newAttachmentsList }
            }
          }
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  }

  return { attachMetadatasToCollectingEvent, detachMetadataIds };
}

export default withRouter(CollectingEventDetailsPage);
