import { DinaForm } from "common-ui";
import {
  ManagedAttributesViewFormLayout,
  ViewPageLayout
} from "../../../components";
import { FormTemplate } from "../../../types/collection-api";
import { useManagedAttributesView } from "./edit";

export default function ManagedAttributesViewDetailsPage() {
  return (
    <ViewPageLayout<FormTemplate>
      form={props => (
        <DinaForm {...props}>
          <ManagedAttributesViewFormLayout />
        </DinaForm>
      )}
      customQueryHook={useManagedAttributesView}
      entityLink="/collection/managed-attributes-view"
      type="form-template"
      apiBaseUrl="/collection-api"
    />
  );
}
