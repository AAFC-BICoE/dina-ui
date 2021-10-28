import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { useCollectingEventQuery } from "../../../components/collection";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

export default function CollectingEventDetailsPage() {
  return (
    <ViewPageLayout<CollectingEvent>
      form={props => (
        <DinaForm<CollectingEvent> {...props}>
          <h1 id="wb-cont">
            <DinaMessage id="collectingEventViewTitle" />
          </h1>
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
