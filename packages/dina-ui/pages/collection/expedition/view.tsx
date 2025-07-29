import { DinaForm, FieldSet, QueryTable } from "common-ui";
import _ from "lodash";
import { ViewPageLayout } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { getColumnDefinition } from "../collecting-event/list";
import { ExpeditionFormLayout } from "../../../components/collection/expedition/ExpeditionFormLayout";
import {
  Expedition,
  CollectingEvent
} from "packages/dina-ui/types/collection-api";

export default function ExpeditionDetailsPage() {
  return (
    <ViewPageLayout<Expedition>
      form={(props) => (
        <DinaForm<Expedition>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: _.fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            )
          }}
        >
          <ExpeditionFormLayout />
          <FieldSet legend={<DinaMessage id="collectingEvents" />}>
            <QueryTable<CollectingEvent>
              path="collection-api/collecting-event"
              include="collection"
              columns={getColumnDefinition()}
              filter={{
                rsql: `expedition.uuid==${props.initialValues.id}`
              }}
            />
          </FieldSet>
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/expedition/${id}?include=participants`
      })}
      entityLink="/collection/expedition"
      type="expedition"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
