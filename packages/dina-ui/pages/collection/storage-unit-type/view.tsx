import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { StorageUnitType } from "../../../types/collection-api";
import { StorageUnitTypeFormFields } from "./edit";

export default function StorageUnitTypeDetailsPage() {
  return (
    <ViewPageLayout<StorageUnitType>
      form={(props) => (
        <DinaForm<StorageUnitType> {...props}>
          <StorageUnitTypeFormFields />
        </DinaForm>
      )}
      query={(id) => ({ path: `collection-api/storage-unit-type/${id}` })}
      entityLink="/collection/storage-unit-type"
      type="storage-unit-type"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
