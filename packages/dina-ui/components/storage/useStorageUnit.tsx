import {
  AreYouSureModal,
  DinaFormSubmitParams,
  resourceDifference,
  SaveArgs,
  useApiClient,
  useModal
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { ResourceNameIdentifier } from "../../types/common";

export interface UseStorageUnitSaveParams {
  initialValues?: any;

  // Redirect to next page
  onSaved?: (storageUnit: PersistedResource<StorageUnit>[]) => Promise<void>;
}

export interface PrepareStorageUnitSaveOperationParams {
  submittedValues: any;
  preProcessStorageUnit?: (
    sample: InputResource<StorageUnit>
  ) => Promise<InputResource<StorageUnit>>;
}

export function useStorageUnitSave({
  initialValues,
  onSaved
}: UseStorageUnitSaveParams) {
  const { apiClient, save } = useApiClient();
  const { openModal } = useModal();

  const defaultValues: InputResource<StorageUnit> = {
    type: "storage-unit",
    group: ""
  };

  /**
   * Gets the diff of the form's initial values to the new sample state,
   * so only edited values are submitted to the back-end.
   */
  async function prepareStorageUnitSaveOperation({
    submittedValues,
    preProcessStorageUnit
  }: PrepareStorageUnitSaveOperationParams): Promise<SaveArgs<StorageUnit>> {
    const preprocessed =
      (await preProcessStorageUnit?.(submittedValues)) ?? submittedValues;

    // Only submit the changed values to the back-end:
    const diff = initialValues.id
      ? resourceDifference({
          original: initialValues,
          updated: preprocessed
        })
      : preprocessed;

    const saveOperation = {
      resource: diff,
      type: "storage-unit"
    };
    return saveOperation;
  }

  async function onSubmit({
    submittedValues
  }: DinaFormSubmitParams<StorageUnit>) {
    const savedArgs: SaveArgs<StorageUnit>[] = [];

    const proceedWithSave = async () => {
      if (submittedValues.isMultiple) {
        const names = _.isArray(submittedValues.name)
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
          resource: _.isArray(submittedValues.name)
            ? { ...submittedValues, name: submittedValues.name.join() }
            : submittedValues,
          type: "storage-unit"
        });
      }

      const savedStorage = await save<StorageUnit>(savedArgs, {
        apiBaseUrl: "/collection-api"
      });
      await onSaved?.(savedStorage);
    };

    // Check for any duplicates...
    const duplicatesFound = await checkForDuplicates(
      submittedValues.name,
      submittedValues.group
    );

    if (duplicatesFound) {
      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="storageUnit_duplicate_title" />}
          messageBody={
            <DinaMessage
              id="storageUnit_duplicate_body"
              values={{ duplicatedName: submittedValues.name }}
            />
          }
          onYesButtonClicked={proceedWithSave}
        />
      );
    } else {
      await proceedWithSave();
    }
  }

  async function checkForDuplicates(name: string, group: string) {
    const response = await apiClient.get<ResourceNameIdentifier[]>(
      `/collection-api/resource-name-identifier?filter[type][EQ]=storage-unit&filter[group][EQ]=${group}&filter[name][EQ]=${name}`,
      {
        page: { limit: 1 }
      }
    );

    if (response && response.data.length > 0) {
      // If the returned result is the current record, do not consider it a duplicate.
      if (response.data.at(0)?.id === initialValues?.id) {
        return false;
      }

      return true;
    }
    return false;
  }

  return {
    onSubmit,
    prepareStorageUnitSaveOperation,
    initialValues: initialValues ?? defaultValues
  };
}
