import { DeleteButton, DinaForm, EditButton, Tooltip } from "common-ui";
import { PersistedResource } from "kitsu";
import {
  ResourceFormProps,
  storageUnitDisplayName,
  StorageUnitFormFields,
  ViewPageLayout
} from "../../../components";
import { StorageUnit } from "../../../types/collection-api";

export default function StorageUnitDetailsPage() {
  return (
    <ViewPageLayout<StorageUnit>
      form={(props) => (
        <DinaForm<StorageUnit> {...props}>
          <StorageUnitFormFields />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/storage-unit/${id}?include=parentStorageUnit,storageUnitType`
      })}
      entityLink="/collection/storage-unit"
      type="storage-unit"
      apiBaseUrl="/collection-api"
      editButton={(formProps) => <StorageEditButton {...formProps} />}
      deleteButton={(formProps) =>
        hasChildren(formProps.initialValues) ? null : (
          <DeleteButton
            id={formProps.initialValues.id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/storage-unit/list"
            type="storage-unit"
          />
        )
      }
      showGenerateLabelButton={true}
      nameField={(unit) => storageUnitDisplayName(unit)}
      showRevisionsLink={true}
    />
  );
}

function hasChildren(unit: PersistedResource<StorageUnit>) {
  const children = unit.storageUnitChildren;
  return !!children?.length;
}

function StorageEditButton({ initialValues }: ResourceFormProps<StorageUnit>) {
  return (
    <div>
      <EditButton
        entityId={initialValues.id}
        entityLink="collection/storage-unit"
        ariaDescribedBy="notEditableWhenThereAreChildStorageUnits"
        disabled={hasChildren(initialValues)}
      />
      {hasChildren(initialValues) && (
        <Tooltip id="notEditableWhenThereAreChildStorageUnits" />
      )}
    </div>
  );
}
