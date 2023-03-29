import { DinaForm } from "common-ui";
import {
  ManagedAttributeFormLayout,
  ViewPageLayout
} from "../../../components";
import { ManagedAttribute } from "../../../types/objectstore-api";
import Link from "next/link";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

export default function ManagedAttributesViewPage() {
  const backButton = (
    <Link href="/managed-attribute/list?step=2">
      <a className="back-button my-auto me-auto">
        <DinaMessage id="backToList" />
      </a>
    </Link>
  );
  return (
    <ViewPageLayout<ManagedAttribute>
      form={(props) => (
        <DinaForm<ManagedAttribute> {...props}>
          <ManagedAttributeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `loan-transaction-api/managed-attribute/${id}` })}
      entityLink="/loan-transaction/managed-attribute"
      customBackButton={backButton}
      type="managed-attribute"
      apiBaseUrl="/loan-transaction-api"
    />
  );
}
