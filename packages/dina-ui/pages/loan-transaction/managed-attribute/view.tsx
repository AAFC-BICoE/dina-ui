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
      query={(id) => ({ path: `loan-transaction-api/managed-attribute/${id}` })}
      entityLink="/loan-transaction/managed-attribute"
      specialListUrl="/managed-attribute/list?step=2"
      type="managed-attribute"
      apiBaseUrl="/loan-transaction-api"
    />
  );
}
