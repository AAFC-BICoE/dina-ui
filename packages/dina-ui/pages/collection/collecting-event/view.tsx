import { DinaForm, FieldSet, QueryTable8 } from "common-ui";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { ViewPageLayout, useCollectingEventQuery } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/collecting-event/CollectingEventFormLayout";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import { getColumnDefinition } from "../material-sample/list";

export default function CollectingEventDetailsPage() {
  return (
    <ViewPageLayout<CollectingEvent>
      form={(props) => (
        <DinaForm<CollectingEvent> {...props}>
          <CollectingEventFormLayout />
          <FieldSet legend={<DinaMessage id="materialSamples" />}>
            <QueryTable8<MaterialSample>
              path="collection-api/material-sample"
              include="collection"
              columns={getColumnDefinition()}
              filter={{
                rsql: `collectingEvent.uuid==${props.initialValues.id}`
              }}
            />
          </FieldSet>
        </DinaForm>
      )}
      customQueryHook={(id) => useCollectingEventQuery(id)}
      nameField={["dwcFieldNumber", "dwcRecordNumber", "otherRecordNumbers"]}
      entityLink="/collection/collecting-event"
      type="collecting-event"
      apiBaseUrl="/collection-api"
      mainClass="container-fluid px-5"
      showRevisionsLink={true}
    />
  );
}
