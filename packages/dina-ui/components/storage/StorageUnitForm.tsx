import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  FieldWrapper,
  filterBy,
  ResourceSelectField,
  SaveArgs,
  StringArrayField,
  SubmitButton,
  TextField,
  ToggleField,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { isArray } from "lodash";
import * as yup from "yup";
import {
  GroupSelectField,
  StorageLinkerField,
  StorageUnitBreadCrumb,
  StorageUnitChildrenViewer
} from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { StorageUnit, StorageUnitType } from "../../types/collection-api";

import { useState } from "react";

export const storageUnitFormSchema = yup.object({
  storageUnitType: yup.object().required()
});

export interface StorageUnitFormProps {
  initialParent?: PersistedResource<StorageUnit>;
  storageUnit?: PersistedResource<StorageUnit>;
  onSaved: (storageUnit: PersistedResource<StorageUnit>[]) => Promise<void>;
  buttonBar?: JSX.Element;
  parentIdInURL?: string;
}

export function StorageUnitForm({
  initialParent,
  storageUnit,
  onSaved,
  parentIdInURL,
  buttonBar = (
    <ButtonBar>
      {parentIdInURL ? (
        <BackButton
          entityId={parentIdInURL}
          entityLink={`/collection/storage-unit`}
          buttonMsg={"backToParentUnit"}
        />
      ) : (
        <BackButton
          entityId={storageUnit?.id}
          entityLink="/collection/storage-unit"
        />
      )}
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
    const savedArgs: SaveArgs<StorageUnit>[] = [];

    if (submittedValues.isMultiple) {
      const names = isArray(submittedValues.name)
        ? submittedValues.name
        : [submittedValues.name];
      delete submittedValues.isMultiple;
      names.map((unitName) =>
        savedArgs.push({
          resource: { ...submittedValues, name: unitName },
          type: "storage-unit"
        })
      );
    } else {
      delete submittedValues.isMultiple;
      savedArgs.push({
        resource: isArray(submittedValues.name)
          ? { ...submittedValues, name: submittedValues.name.join() }
          : submittedValues,
        type: "storage-unit"
      });
    }

    const savedStorage = await save<StorageUnit>(savedArgs, {
      apiBaseUrl: "/collection-api"
    });
    await onSaved(savedStorage);
  }

  return (
    <DinaForm<Partial<StorageUnit>>
      initialValues={initialValues}
      validationSchema={storageUnitFormSchema}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <StorageUnitFormFields parentIdInURL={parentIdInURL} />
      {buttonBar}
    </DinaForm>
  );
}

export interface StorageUnitFormFieldsProps {
  parentIdInURL?: string;
}
/** Re-usable field layout between edit and view pages. */
export function StorageUnitFormFields({
  parentIdInURL
}: StorageUnitFormFieldsProps) {
  const { readOnly, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const [showTextAreaInput, setShowTextAreaInput] = useState(false);
  const onStorageUnitMultipleToggled = (checked) => {
    setShowTextAreaInput(checked);
  };

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
        <div className="col-md-6 d-flex ">
          {!readOnly && !initialValues.id && (
            <ToggleField
              className="me-4"
              onChangeExternal={onStorageUnitMultipleToggled}
              name="isMultiple"
              label={formatMessage("multipleUnits")}
            />
          )}
          {!showTextAreaInput && (
            <TextField
              className="flex-grow-1"
              name="name"
              label={formatMessage("storageUnitName")}
            />
          )}

          {showTextAreaInput && (
            <StringArrayField
              className="flex-grow-1"
              name="name"
              label={formatMessage("storageUnitName")}
            />
          )}
        </div>
        <ResourceSelectField<StorageUnitType>
          className="col-md-6"
          model="collection-api/storage-unit-type"
          name="storageUnitType"
          optionLabel={(it) => it.name}
          filter={filterBy(["name"])}
          omitNullOption={true}
          readOnlyLink="/collection/storage-unit-type/view?id="
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="barcode"
          label={formatMessage("field_barcode")}
        />
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
          parentIdInURL={parentIdInURL}
        />
      )}
      {readOnly && <StorageUnitChildrenViewer storageUnit={initialValues} />}
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" showTime={true} />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
