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
  useApiClient,
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
import { Modal, Button } from "react-bootstrap";
import { useState } from "react";
import { ResourceNameIdentifier } from "../../types/common/resources/ResourceNameIdentifier";

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
  )
}: StorageUnitFormProps) {
  const { apiClient } = useApiClient();

  const initialValues = storageUnit || {
    type: "storage-unit",
    parentStorageUnit: initialParent
  };

  // State used to hold the name that was duplicated, if it exists the warning will appear.
  const [duplicatedName, setDuplicatedName] = useState<string>();

  const [proceedWithDuplicate, setProceedWithDuplicate] =
    useState<boolean>(false);

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<StorageUnit>) {
    const savedArgs: SaveArgs<StorageUnit>[] = [];

    // Check for any duplicates...
    const duplicatesFound = await checkForDuplicates(
      submittedValues.name,
      submittedValues.group
    );
    if (duplicatesFound && !proceedWithDuplicate) {
      setDuplicatedName(submittedValues.name);
      return;
    }

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

  async function checkForDuplicates(name: string, group: string) {
    const response = await apiClient.get<ResourceNameIdentifier[]>(
      `/collection-api/resource-name-identifier?filter[type][EQ]=storage-unit&filter[group][EQ]=${group}&filter[name][EQ]=${name}`,
      {
        page: { limit: 1 }
      }
    );

    if (response && response.data.length > 0) {
      return true;
    }
    return false;
  }

  function hideDuplicateWarning() {
    setDuplicatedName(undefined);
  }

  function proceedAnyway() {
    setProceedWithDuplicate(true);
  }

  return (
    <DinaForm<Partial<StorageUnit>>
      initialValues={initialValues}
      validationSchema={storageUnitFormSchema}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <Modal
        show={duplicatedName !== undefined && !proceedWithDuplicate}
        centered={true}
      >
        <Modal.Header closeButton={true} onHide={hideDuplicateWarning}>
          <Modal.Title>Storage Unit Name already exists</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          The name "{duplicatedName}" is already in use for another storage unit
          in this group. Would you still like to proceed?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={hideDuplicateWarning}>
            Cancel
          </Button>
          <Button variant="primary" onClick={proceedAnyway}>
            Proceed anyway
          </Button>
        </Modal.Footer>
      </Modal>
      <StorageUnitFormFields parentIdInURL={parentIdInURL} />
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
        <div className="col-md-6">
          {!readOnly && !initialValues.id && (
            <ToggleField
              className="me-4"
              onChangeExternal={onStorageUnitMultipleToggled}
              name="isMultiple"
              label={formatMessage("multipleUnits")}
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
          parentStorageUnitUUID={initialValues.id}
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
