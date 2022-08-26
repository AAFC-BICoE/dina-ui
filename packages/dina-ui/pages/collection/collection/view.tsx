import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../../components";
import { Collection } from "../../../types/collection-api";
import { CollectionFormFields } from "./edit";

export default function CollectionDetailsPage() {
  return (
    <ViewPageLayout<Collection>
      form={props => (
        <DinaForm<Collection>
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
          <CollectionFormFields title={"collectionViewTitle"} />
        </DinaForm>
      )}
      query={id => ({
        path: `collection-api/collection/${id}`,
        include: "institution,parentCollection"
      })}
      entityLink="/collection/collection"
      type="collection"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
