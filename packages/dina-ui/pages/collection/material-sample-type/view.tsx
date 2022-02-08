import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { MaterialSampleType } from "../../../types/collection-api";
import { MaterialSampleTypeFormFields } from "./edit";

export default function MaterialSampleTypeDetailsPage() {
  return (
    <ViewPageLayout<MaterialSampleType>
      form={props => (
        <DinaForm<MaterialSampleType> {...props}>
          <MaterialSampleTypeFormFields />
        </DinaForm>
      )}
      query={id => ({ path: `collection-api/material-sample-type/${id}` })}
      entityLink="/collection/material-sample-type"
      type="material-sample-type"
      apiBaseUrl="/collection-api"
      isRestricted={true}
      showRevisionsLink={true}
    />
  );
}
