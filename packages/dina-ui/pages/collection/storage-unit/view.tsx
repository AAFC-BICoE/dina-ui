import { DeleteButton, DinaForm, EditButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
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
      form={props => (
        <DinaForm<StorageUnit> {...props}>
          <StorageUnitFormFields />
        </DinaForm>
      )}
      query={id => ({
        path: `collection-api/storage-unit/${id}?include=parentStorageUnit,storageUnitChildren,storageUnitType,hierarchy`
      })}
      entityLink="/collection/storage-unit"
      type="storage-unit"
      apiBaseUrl="/collection-api"
      editButton={formProps => <StorageEditButton {...formProps} />}
      deleteButton={formProps =>
        hasChildren(formProps.initialValues) ? null : (
          <DeleteButton
            id={formProps.initialValues.id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/storage-unit/list"
            type="storage-unit"
          />
        )
      }
      showRevisionsLink={true}
      nameField={unit => storageUnitDisplayName(unit)}
    />
  );
}

function hasChildren(unit: PersistedResource<StorageUnit>) {
  const children = unit.storageUnitChildren;
  return !!children?.length;
}

function StorageEditButton({ initialValues }: ResourceFormProps<StorageUnit>) {
  return hasChildren(initialValues) ? (
    <div className="alert alert-warning m-0">
      <DinaMessage id="notEditableWhenThereAreChildStorageUnits" />
    </div>
  ) : (
    <EditButton
      entityId={initialValues.id}
      entityLink="collection/storage-unit"
      ariaDescribedBy="notEditableWhenThereAreChildStorageUnits"
    />
  );
}
