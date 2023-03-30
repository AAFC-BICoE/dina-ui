import { DinaForm } from "common-ui";
import {
  ManagedAttributeFormLayout,
  ViewPageLayout
} from "../../../components";
import { ManagedAttribute } from "../../../types/objectstore-api";
import Link from "next/link";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

export default function ManagedAttributesViewPage() {
  return (
    <ViewPageLayout<ManagedAttribute>
      form={(props) => (
        <DinaForm<ManagedAttribute> {...props}>
          <ManagedAttributeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `objectstore-api/managed-attribute/${id}` })}
      entityLink="/object-store/managed-attribute"
      specialListUrl="/managed-attribute/list?step=1"
      type="managed-attribute"
      apiBaseUrl="/objectstore-api"
    />
  );
}
