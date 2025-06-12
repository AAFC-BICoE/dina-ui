import { DinaForm } from "common-ui";
import _ from "lodash";
import { PreparationType } from "../../../types/collection-api/resources/PreparationType";
import { ViewPageLayout } from "../../../components";
import { PreparationTypeFormLayout } from "./edit";

export default function PreparationTypeDetailsPage() {
  return (
    <ViewPageLayout<PreparationType>
      form={(props) => (
        <DinaForm<PreparationType>
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
          <PreparationTypeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `collection-api/preparation-type/${id}` })}
      entityLink="/collection/preparation-type"
      type="preparation-type"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
