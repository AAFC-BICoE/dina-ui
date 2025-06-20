import { DinaForm } from "common-ui";
import _ from "lodash";
import { ViewPageLayout } from "../../../components";
import { CollectionMethod } from "../../../types/collection-api/resources/CollectionMethod";
import { CollectionMethodFormLayout } from "./edit";

export default function CollectionMethodDetailsPage() {
  return (
    <ViewPageLayout<CollectionMethod>
      form={(props) => (
        <DinaForm<CollectionMethod>
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
          <CollectionMethodFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `collection-api/collection-method/${id}` })}
      entityLink="/collection/collection-method"
      type="collection-method"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
