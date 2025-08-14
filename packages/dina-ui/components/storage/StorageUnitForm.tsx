import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  StringArrayField,
  SubmitButton,
  TextField,
  ToggleField,
  useDinaFormContext,
  useQuery
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import * as yup from "yup";
import {
  GroupSelectField,
  StorageLinkerField,
  StorageUnitChildrenViewer
} from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import {
  MaterialSample,
  StorageUnit,
  StorageUnitType
} from "../../types/collection-api";
import { Ref, useState } from "react";
import StorageUnitGrid from "./grid/StorageUnitGrid";
import { FormikProps, useFormikContext } from "formik";
import { useStorageUnitSave } from "./useStorageUnit";

export const storageUnitFormSchema = yup.object({
  storageUnitType: yup.object().required()
});

export interface StorageUnitFormProps {
  initialParent?: PersistedResource<StorageUnit>;
  storageUnit?: PersistedResource<StorageUnit>;
  onSaved?: (storageUnit: PersistedResource<StorageUnit>[]) => Promise<void>;
  buttonBar?: JSX.Element;
  parentIdInURL?: string;

  /** Optionally call the hook from the parent component. */
  storageUnitSaveHook?: ReturnType<typeof useStorageUnitSave>;

  // Form ref from bulk edit tab
  storageUnitFormRef?: Ref<FormikProps<InputResource<StorageUnit>>>;

  isBulkEditTabForm?: boolean;
}

export function StorageUnitForm({
  initialParent,
  storageUnit,
  onSaved,
  parentIdInURL,
  buttonBar = (
    <ButtonBar className="mb-4">
      <div className="col-md-6 col-sm-12 mt-2">
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
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  ),
  storageUnitSaveHook,
  storageUnitFormRef,
  isBulkEditTabForm
}: StorageUnitFormProps) {
  const { initialValues, onSubmit } =
    storageUnitSaveHook ??
    useStorageUnitSave({
      initialValues: storageUnit || {
        type: "storage-unit",
        parentStorageUnit: initialParent,
        isGeneric: false
      },
      onSaved
    });

  const storageUnitOnSubmit = async (submittedValues) => {
    await onSubmit(submittedValues);
  };

  return (
    <DinaForm<InputResource<StorageUnit>>
      initialValues={initialValues}
      validationSchema={storageUnitFormSchema}
      onSubmit={storageUnitOnSubmit}
      innerRef={storageUnitFormRef}
    >
      {buttonBar}
      <StorageUnitFormFields
        parentIdInURL={parentIdInURL}
        isBulkEditTabForm={isBulkEditTabForm}
      />
    </DinaForm>
  );
}

export interface StorageUnitFormFieldsProps {
  parentIdInURL?: string;
  /** Reduces the rendering to improve performance when bulk editing many resources. */
  reduceRendering?: boolean;

  isBulkEditTabForm?: boolean;
}
/** Re-usable field layout between edit and view pages. */
export function StorageUnitFormFields({
  parentIdInURL,
  reduceRendering,
  isBulkEditTabForm
}: StorageUnitFormFieldsProps) {
  const { readOnly, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const [showTextAreaInput, setShowTextAreaInput] = useState(false);
  const formik = useFormikContext<StorageUnit>();
  const onStorageUnitMultipleToggled = (checked) => {
    setShowTextAreaInput(checked);
  };

  const materialSamplesQuery = useQuery<MaterialSample[]>({
    path: "collection-api/material-sample",
    filter: { rsql: `storageUnitUsage.storageUnit.uuid==${initialValues?.id}` },
    include: "storageUnitUsage",
    page: { limit: 1000 }
  });

  return materialSamplesQuery.loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      <div className="row">
        <div className="col-md-6 d-flex">
          {!readOnly && !initialValues.id && !isBulkEditTabForm && (
            <ToggleField
              className="me-4"
              onChangeExternal={onStorageUnitMultipleToggled}
              name="isMultiple"
              label={formatMessage("multipleUnits")}
            />
          )}
          {(!readOnly || initialValues.isGeneric) && (
            <ToggleField
              className="me-4"
              name="isGeneric"
              label={formatMessage("isGeneric")}
            />
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 d-flex ">
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
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="barcode"
          label={formatMessage("field_barcode")}
        />
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
      {!reduceRendering &&
        initialValues?.storageUnitType?.gridLayoutDefinition &&
        !formik?.values?.isGeneric && (
          <StorageUnitGrid
            storageUnit={initialValues}
            materialSamples={materialSamplesQuery.response?.data}
          />
        )}
      {!reduceRendering && (
        <StorageLinkerField
          name="parentStorageUnit"
          targetType="storage-unit"
          parentIdInURL={parentIdInURL}
          currentStorageUnitUUID={initialValues.id}
          createStorageMode={true}
        />
      )}
      {readOnly && (
        <StorageUnitChildrenViewer
          storageUnit={initialValues}
          materialSamples={materialSamplesQuery?.response?.data}
        />
      )}
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" showTime={true} />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
