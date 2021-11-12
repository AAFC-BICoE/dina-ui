import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { useCollectingEventQuery } from "../../../components/collection";
import { CollectingEventFormLayout } from "../../../components/collection/collecting-event/CollectingEventFormLayout";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

export default function CollectingEventDetailsPage() {
  return (
    <ViewPageLayout<CollectingEvent>
      form={props => (
        <DinaForm<CollectingEvent> {...props}>
          <CollectingEventFormLayout />
        </DinaForm>
      )}
      query={id => ({ path: `collection-api/collecting-event/${id}` })}
      customQueryHook={id => useCollectingEventQuery(id)}
      nameField="id"
      entityLink="/collection/collecting-event"
      type="collecting-event"
      apiBaseUrl="/collection-api"
      mainClass="container-fluid"
      showRevisionsLink={true}
    />
  );
}
