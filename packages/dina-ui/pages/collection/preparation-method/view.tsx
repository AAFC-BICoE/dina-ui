import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { PreparationMethod } from "../../../types/collection-api/resources/PreparationMethod";
import { ViewPageLayout } from "../../../components";
import { PreparationMethodFormLayout } from "./edit";

export default function PreparationMethodDetailsPage() {
  return (
    <ViewPageLayout<PreparationMethod>
      form={props => (
        <DinaForm<PreparationMethod>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            )
          }}
        >
          <PreparationMethodFormLayout />
        </DinaForm>
      )}
      query={id => ({ path: `collection-api/preparation-method/${id}` })}
      entityLink="/collection/preparation-method"
      type="preparation-method"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
