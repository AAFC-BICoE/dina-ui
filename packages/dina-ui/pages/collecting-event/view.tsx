import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  DinaForm,
  EditButton,
  FieldView,
  useQuery,
  withResponse
} from "common-ui";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResponse } from "kitsu";
import { uniqBy } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { useContext, useState } from "react";
import { Footer, GroupFieldView, Head, Nav } from "../../components";
import { AttachmentSection } from "../../components/object-store/attachment-list/AttachmentSection";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/collection-api/resources/CollectingEvent";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useContext(ApiClientContext);
  const [collectingEvent, setCollectingEvent] = useState<CollectingEvent>();

  const getAgents = (response: KitsuResponse<CollectingEvent, undefined>) => {
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
    agents
      .then(async () => {
        response.data.collectors = await agents;
        setCollectingEvent(response.data);
      })
      .finally(() => setCollectingEvent(response.data));
  };

  const collectingEventQuery = useQuery<CollectingEvent>(
    {
      path: `collection-api/collecting-event/${id}`,
      include: "attachment,collectors"
    },
    {
      onSuccess: getAgents
    }
  );

  const {
    attachMetadatasToCollectingEvent,
    detachMetadataIds
  } = useAttachMetadatasToCollectingEvent();

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
      {withResponse(collectingEventQuery, ({ data: colEvent }) => {
        if (colEvent.createdOn) {
          const inUserTimeZone = new Date(colEvent.createdOn).toString();
          if (collectingEvent) collectingEvent.createdOn = inUserTimeZone;
        }

        return (
          <main className="container-fluid">
            <h1>
              <DinaMessage id="collectingEventViewTitle" />
            </h1>
            <div>
              {collectingEvent && (
                <DinaForm<CollectingEvent> initialValues={collectingEvent}>
                  <div>
                    <div className="form-group">
                      <div className="row">
                        <GroupFieldView
                          className="col-md-2"
                          name="group"
                          label={formatMessage("field_group")}
                        />
                      </div>
                      <div className="row" style={{ position: "relative" }}>
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
                        {/* Stick this field to the bottom of the row div to align with the other fields in this row: */}
                        <style>{`.verbatimEventDateTime-field { position: absolute; bottom: 0; width: 100%; }`}</style>
                        <FieldView
                          className="col-md-3"
                          name="verbatimEventDateTime"
                          label={formatMessage("verbatimEventDateTimeLabel")}
                        />
                      </div>
                      <div className="row">
                        <FieldView className="col-md-2" name="dwcRecordedBy" />
                        <FieldView className="col-md-2" name="collectors" />
                        <FieldView
                          className="col-md-2"
                          name="dwcRecordNumbers"
                        />
                      </div>
                      <div className="row">
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimLocality"
                        />
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimLatitude"
                        />
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimLongitude"
                        />
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimCoordinates"
                        />
                      </div>
                      <div className="row">
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimCoordinateSystem"
                        />
                        <FieldView className="col-md-2" name="dwcVerbatimSRS" />
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimElevation"
                        />
                        <FieldView
                          className="col-md-2"
                          name="dwcVerbatimDepth"
                        />
                      </div>
                    </div>
                  </div>
                </DinaForm>
              )}
              <div className="form-group">
                <AttachmentSection
                  attachmentPath={`collection-api/collecting-event/${id}/attachment`}
                  onDetachMetadataIds={metadataIds =>
                    detachMetadataIds(metadataIds, String(id))
                  }
                  afterMetadatasSaved={metadataIds =>
                    attachMetadatasToCollectingEvent(metadataIds, String(id))
                  }
                />
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
    const newAttachmentList = uniqBy(
      [
        ...(collectingEvent.attachment ?? []),
        ...metadataIds.map(id => ({ id, type: "metadata" }))
      ],
      attachment => attachment.id
    );

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
