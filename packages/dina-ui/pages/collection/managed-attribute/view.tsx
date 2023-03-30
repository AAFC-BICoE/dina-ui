import { DinaForm, SelectField } from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS
} from "../../../types/collection-api/resources/ManagedAttribute";
import { ManagedAttribute } from "../../../types/objectstore-api";
import {
  ManagedAttributeFormLayout,
  ViewPageLayout
} from "../../../components";
import Link from "next/link";

export default function ManagedAttributesViewPage() {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: CollectionModuleType;
  }[] = COLLECTION_MODULE_TYPES.map((dataType) => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
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
      query={(id) => ({ path: `collection-api/managed-attribute/${id}` })}
      entityLink="/collection/managed-attribute"
      specialListUrl="/managed-attribute/list?step=0"
      type="managed-attribute"
      apiBaseUrl="/collection-api"
    />
  );
}
