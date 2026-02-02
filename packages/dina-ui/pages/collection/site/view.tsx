import {
  DinaForm,
  FieldSet,
  QueryTable,
  SimpleSearchFilterBuilder
} from "common-ui";
import _ from "lodash";
import { ViewPageLayout } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { getColumnDefinition } from "../collecting-event/list";
import { SiteFormLayout } from "../../../components/collection/site/SiteFormLayout";
import {
  Site,
  CollectingEvent
} from "packages/dina-ui/types/collection-api";

export default function SiteDetailsPage() {
  return (
    <ViewPageLayout<Site>
      form={(props) => (
        <DinaForm<Site>
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
          <SiteFormLayout />
          <FieldSet legend={<DinaMessage id="collectingEvents" />}>
            <QueryTable<CollectingEvent>
              path="collection-api/collecting-event"
              columns={getColumnDefinition()}
              filter={SimpleSearchFilterBuilder.create<Site>()
                .where(
                  "site.uuid" as any,
                  "EQ",
                  `${props.initialValues.id}`
                )
                .build()}
            />
          </FieldSet>
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/site/${id}?include=participants`
      })}
      entityLink="/collection/site"
      type="site"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
