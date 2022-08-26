import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../../components";
import { Institution } from "../../../types/collection-api";
import { InstitutionFormLayout } from "./edit";

export default function InstitutionDetailsPage() {
  return (
    <ViewPageLayout<Institution>
      form={props => (
        <DinaForm<Institution>
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
          <InstitutionFormLayout />
        </DinaForm>
      )}
      query={id => ({ path: `collection-api/institution/${id}` })}
      entityLink="/collection/institution"
      type="institution"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
