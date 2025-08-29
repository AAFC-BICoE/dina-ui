import { DinaForm, SelectField } from "common-ui";
import _ from "lodash";
import {
  ManagedAttributeFormLayout,
  ViewPageLayout
} from "../../../components";
import {
  ManagedAttribute,
  SEQDB_MODULE_TYPE_LABELS,
  SEQDB_MODULE_TYPES,
  SeqDBModuleType
} from "../../../types/collection-api";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export default function ManagedAttributesViewPage() {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: SeqDBModuleType;
  }[] = SEQDB_MODULE_TYPES.map((dataType) => ({
    label: formatMessage(SEQDB_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));
  const componentField = (
    <SelectField
      className="col-md-6"
      name="managedAttributeComponent"
      options={ATTRIBUTE_COMPONENT_OPTIONS}
    />
  );
  return (
    <ViewPageLayout<ManagedAttribute>
      form={(props) => (
        <DinaForm<ManagedAttribute> {...props}>
          <ManagedAttributeFormLayout componentField={componentField} />
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/managed-attribute/${id}` })}
      alterInitialValues={(data) =>
        data
          ? {
              ...data,
              // Convert multilingualDescription to editable Dictionary format:
              multilingualDescription: _.fromPairs<string | undefined>(
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
      entityLink="/seqdb/managed-attribute"
      specialListUrl="/managed-attribute/list?tab=3"
      type="managed-attribute"
      apiBaseUrl="/seqdb-api"
      showDeleteButton={false}
    />
  );
}
