import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import {
  ManagedAttributeFormLayout,
  ViewPageLayout
} from "../../../components";
import { ManagedAttribute } from "../../../types/collection-api";

export default function ManagedAttributesViewPage() {
  return (
    <ViewPageLayout<ManagedAttribute>
      form={(props) => (
        <DinaForm<ManagedAttribute> {...props}>
          <ManagedAttributeFormLayout withGroup={false} />
        </DinaForm>
      )}
      query={(id) => ({ path: `objectstore-api/managed-attribute/${id}` })}
      alterInitialValues={(data) =>
        data
          ? {
              ...data,
              // Convert multilingualDescription to editable Dictionary format:
              multilingualDescription: fromPairs<string | undefined>(
                data.multilingualDescription?.descriptions?.map(
                  ({ desc, lang }) => [lang ?? "", desc ?? ""]
                )
              ),
              vocabularyElementType:
                (data && data?.acceptedValues?.length) || 0 > 0
                  ? "PICKLIST"
                  : data.vocabularyElementType
            }
          : { type: "managed-attribute" }
      }
      entityLink="/object-store/managed-attribute"
      specialListUrl="/managed-attribute/list?step=1"
      type="managed-attribute"
      apiBaseUrl="/objectstore-api"
    />
  );
}
