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
          <ManagedAttributeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `loan-transaction-api/managed-attribute/${id}` })}
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
      entityLink="/loan-transaction/managed-attribute"
      specialListUrl="/managed-attribute/list?step=2"
      type="managed-attribute"
      apiBaseUrl="/loan-transaction-api"
    />
  );
}
