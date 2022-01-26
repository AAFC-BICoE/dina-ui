import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  FieldWrapper,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import * as yup from "yup";
import {
  GroupSelectField,
  StorageLinkerField,
  StorageUnitBreadCrumb,
  StorageUnitChildrenViewer
} from "..";
import { StorageUnit, StorageUnitType } from "../../types/collection-api";

export const storageUnitFormSchema = yup.object({
  storageUnitType: yup.object().required()
});

export interface StorageUnitFormProps {
  initialParent?: PersistedResource<StorageUnit>;
  storageUnit?: PersistedResource<StorageUnit>;
  onSaved: (storageUnit: PersistedResource<StorageUnit>) => Promise<void>;
  buttonBar?: JSX.Element;
}

export function StorageUnitForm({
  initialParent,
  storageUnit,
  onSaved,
  buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={storageUnit?.id}
        entityLink="/collection/storage-unit"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  )
}: StorageUnitFormProps) {
  const initialValues = storageUnit || {
    type: "storage-unit",
    parentStorageUnit: initialParent
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<StorageUnit>) {
    const [savedStorage] = await save<StorageUnit>(
      [
        {
          resource: submittedValues,
          type: "storage-unit"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedStorage);
  }

  return (
    <DinaForm<Partial<StorageUnit>>
      initialValues={initialValues}
      validationSchema={storageUnitFormSchema}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <StorageUnitFormFields />
      {buttonBar}
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function StorageUnitFormFields() {
  const { readOnly, initialValues } = useDinaFormContext();

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <ResourceSelectField<StorageUnitType>
          className="col-md-6"
          model="collection-api/storage-unit-type"
          name="storageUnitType"
          optionLabel={it => it.name}
          filter={filterBy(["name"])}
          omitNullOption={true}
          readOnlyLink="/collection/storage-unit-type/view?id="
        />
        <TextField className="col-md-6" name="name" />
      </div>
      {readOnly ? (
        <FieldWrapper
          name="location"
          readOnlyRender={(_, form) => (
            <StorageUnitBreadCrumb
              storageUnit={form.values}
              // Don't show this storage unit in the breadcrumb:
              hideThisUnit={true}
            />
          )}
        />
      ) : (
        <StorageLinkerField
          name="parentStorageUnit"
          targetType="storage-unit"
        />
      )}
      {readOnly && <StorageUnitChildrenViewer parentId={initialValues.id} />}
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" showTime={true} />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
