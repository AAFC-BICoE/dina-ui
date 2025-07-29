import { DinaForm } from "common-ui";
import _ from "lodash";
import { ViewPageLayout } from "../../../components";
import { ExpeditionFormLayout } from "../../../components/collection/expedition/ExpeditionFormLayout";
import { Expedition } from "../../../types/collection-api/resources/Expedition";

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
