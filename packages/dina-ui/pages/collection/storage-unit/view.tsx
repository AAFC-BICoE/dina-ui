import { DinaForm, EditButton, Tooltip } from "common-ui";
import { useState } from "react";
import {
  ResourceFormProps,
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
        path: `collection-api/storage-unit/${id}?include=storageUnitChildren`
      })}
      entityLink="/collection/storage-unit"
      type="storage-unit"
      apiBaseUrl="/collection-api"
      editButton={formProps => <StorageEditButton {...formProps} />}
      deleteButton={() => null}
      showRevisionsLink={true}
    />
  );
}

function StorageEditButton({ initialValues }: ResourceFormProps<StorageUnit>) {
  const children = initialValues.storageUnitChildren;
  const hasChildren = !!children?.length;

  const [visible, setVisible] = useState(false);

  const editButton = (
    <EditButton
      entityId={initialValues.id}
      entityLink="collection/storage-unit"
      disabled={hasChildren}
      onKeyUp={e => (e.key === "Escape" ? setVisible(false) : setVisible(true))}
      onMouseOver={() => setVisible(true)}
      onMouseOut={() => setVisible(false)}
      onBlur={() => setVisible(false)}
      ariaDescribedBy={"notEditableWhenThereAreChildStorageUnits"}
    />
  );

  return hasChildren ? (
    <Tooltip
      visibleElement={editButton}
      setVisible={setVisible}
      visible={visible}
      id="notEditableWhenThereAreChildStorageUnits"
    />
  ) : (
    editButton
  );
}
