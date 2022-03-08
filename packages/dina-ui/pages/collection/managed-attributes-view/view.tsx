import { DinaForm } from "common-ui";
import {
  ManagedAttributesViewFormLayout,
  ViewPageLayout
} from "../../../components";
import { CustomView } from "../../../types/collection-api";
import { useManagedAttributesView } from "./edit";

export default function ManagedAttributesViewDetailsPage() {
  return (
    <ViewPageLayout<CustomView>
      form={props => (
        <DinaForm {...props}>
          <ManagedAttributesViewFormLayout />
        </DinaForm>
      )}
      customQueryHook={useManagedAttributesView}
      entityLink="/collection/managed-attributes-view"
      type="custom-view"
      apiBaseUrl="/collection-api"
    />
  );
}
