import React from "react";
import { InputResource } from "kitsu";
import {
  BulkEditTabContextI,
  ButtonBar,
  ClearType,
  DinaForm,
  DoOperationsError,
  FormikButton,
  getBulkEditTabFieldInfo,
  isResourceEmpty,
  ResourceWithHooks,
  SaveArgs,
  useApiClient,
  withoutBlankFields
} from "common-ui";
import {
  BulkEditNavigator,
  BulkNavigatorTab
} from "../bulk-edit/BulkEditNavigator";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormikProps } from "formik";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import _ from "lodash";
import { useBulkEditTab } from "../bulk-edit/useBulkEditTab";
import { StorageUnit } from "packages/dina-ui/types/collection-api";
import { StorageUnitForm } from "./StorageUnitForm";
import { useStorageUnitSave } from "./useStorageUnit";

export interface StorageUnitBulkEditorProps {
  storageUnits: InputResource<StorageUnit>[];
  onSaved: (ids: string[]) => void | Promise<void>;
  onPreviousClick?: () => void;
}
function getStorageUnitHooks(storageUnits) {
  return storageUnits.map((resource, index) => {
    const key = `storage-unit-${index}`;
    return {
      key,
      resource,
      saveHook: useStorageUnitSave({
        initialValues: resource
      }),
      formRef: useRef(null)
    };
  });
}

export function StorageUnitBulkEditor({
  storageUnits: storageUnitsProp,
  onPreviousClick,
  onSaved
}: StorageUnitBulkEditorProps) {
  const [selectedTab, setSelectedTab] = useState<
    BulkNavigatorTab | ResourceWithHooks
  >();

  const storageUnits = useMemo(() => storageUnitsProp, []);

  const initialValues: InputResource<StorageUnit> = {
    type: "storage-unit"
  };

  const bulkEditStorageUnitHook = useStorageUnitSave({
    initialValues
  });

  const bulkEditFormRef = useRef<FormikProps<InputResource<StorageUnit>>>(null);

  const storageUnitHooks = getStorageUnitHooks(storageUnits);

  const bulkEditTabStorageUnitForm = (
    <StorageUnitForm
      storageUnit={initialValues as any}
      storageUnitFormRef={bulkEditFormRef}
      storageUnitSaveHook={bulkEditStorageUnitHook}
      buttonBar={<></>}
      isBulkEditTabForm={true}
    />
  );

  function storageUnitBulkOverrider() {
    return getStorageUnitBulkOverrider(bulkEditFormRef);
  }

  const [initialized, setInitialized] = useState(false);

  const { bulkEditTab, clearedFields } = useBulkEditTab({
    resourceHooks: storageUnitHooks,
    hideBulkEditTab: !initialized,
    resourceForm: bulkEditTabStorageUnitForm,
    bulkEditFormRef
  });

  useEffect(() => {
    // Set the initial tab to the Edit All tab:
    setSelectedTab(bulkEditTab);
  }, []);

  const { saveAll } = useBulkStorageUnitSave({
    onSaved,
    storageUnitPreProcessor: storageUnitBulkOverrider,
    bulkEditCtx: {
      resourceHooks: storageUnitHooks,
      bulkEditFormRef,
      clearedFields
    }
  });

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar className="button-bar">
          {onPreviousClick && (
            <div style={{ display: "inline-block", width: "50%" }}>
              <FormikButton
                className="btn btn-outline-secondary previous-button"
                onClick={onPreviousClick}
                buttonProps={() => ({ style: { width: "13rem" } })}
              >
                <DinaMessage id="goToThePreviousStep" />
              </FormikButton>
            </div>
          )}
          <div
            style={{
              display: "inline-block",
              width: "50%",
              textAlign: "right"
            }}
          >
            <FormikButton
              className="btn btn-primary bulk-save-button"
              onClick={saveAll}
              buttonProps={() => ({ style: { width: "10rem" } })}
            >
              <DinaMessage id="saveAll" />
            </FormikButton>
          </div>
        </ButtonBar>
      </DinaForm>
      {selectedTab && (
        <BulkEditNavigator
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          resources={storageUnitHooks}
          extraTabs={[bulkEditTab]}
          tabNameConfig={(storageUnit: ResourceWithHooks<StorageUnit>) =>
            storageUnit?.resource?.name
          }
          renderOneResource={({ index }) => (
            <StorageUnitForm
              storageUnitFormRef={(form) => {
                const isLastRefSetter =
                  storageUnitHooks.filter((it) => !it.formRef.current)
                    .length === 1;
                storageUnitHooks[index].formRef.current = form;
                if (isLastRefSetter && form) {
                  setInitialized(true);
                }
              }}
              storageUnitSaveHook={storageUnitHooks[index].saveHook}
              buttonBar={<></>}
            />
          )}
        />
      )}
    </div>
  );
}

export function getStorageUnitBulkOverrider(bulkEditFormRef) {
  let bulkEditStorageUnit: InputResource<StorageUnit> | undefined;

  /** Returns an object with the overridden values. */
  return async function withBulkEditOverrides(
    baseStorageUnit: InputResource<StorageUnit>
  ) {
    const formik = bulkEditFormRef.current;
    // Shouldn't happen, but check for type safety:
    if (!formik) {
      throw new Error("Missing Formik ref for Bulk Edit Tab");
    }

    // Initialize the bulk values once to make sure the same object is used each time.
    if (!bulkEditStorageUnit) {
      bulkEditStorageUnit = formik.values;
    }

    /** Override object with only the non-empty fields. */
    const overrides = withoutBlankFields(bulkEditStorageUnit, formik.values);

    const newStorageUnit: InputResource<StorageUnit> = {
      ...baseStorageUnit,
      ...overrides
    };

    return newStorageUnit;
  };
}

interface BulkStorageUnitSaveParams {
  onSaved: (storageUnitIds: string[]) => void | Promise<void>;
  storageUnitPreProcessor?: () => (
    storageUnit: InputResource<StorageUnit>
  ) => Promise<InputResource<StorageUnit>>;
  bulkEditCtx: BulkEditTabContextI<StorageUnit>;
}

/**
 * Provides a "save" method to bulk save the in one database transaction
 * with try/catch error handling to put the error indicators on the correct tab.
 */
function useBulkStorageUnitSave({
  onSaved,
  storageUnitPreProcessor,
  bulkEditCtx
}: BulkStorageUnitSaveParams) {
  // Force re-render when there is a bulk submission error:
  const [_error, setError] = useState<unknown | null>(null);
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const { bulkEditFormRef, resourceHooks, clearedFields } = bulkEditCtx;

  async function saveAll() {
    setError(null);
    bulkEditFormRef.current?.setStatus(null);
    bulkEditFormRef.current?.setErrors({});
    try {
      // First clear all tab errors:
      for (const { formRef } of resourceHooks) {
        formRef.current?.setStatus(null);
        formRef.current?.setErrors({});
      }

      const preProcessStorageUnit = storageUnitPreProcessor?.();

      // To be saved to back-end
      const saveOperations: SaveArgs<StorageUnit>[] = [];
      for (let index = 0; index < resourceHooks.length; index++) {
        const { formRef, resource, saveHook } = resourceHooks[index];
        const formik = formRef.current;

        // These two errors shouldn't happen:
        if (!formik) {
          throw new Error(`Missing Formik ref for ${resource.name}`);
        }

        try {
          const submittedValues = formik.values;

          const saveOp = await saveHook.prepareStorageUnitSaveOperation({
            submittedValues,
            preProcessStorageUnit: async (original) => {
              try {
                return (await preProcessStorageUnit?.(original)) ?? original;
              } catch (error: unknown) {
                if (error instanceof DoOperationsError) {
                  // Re-throw as Edit All tab error:
                  throw new DoOperationsError(
                    error.message,
                    error.fieldErrors,
                    error.individualErrors.map((opError) => ({
                      ...opError,
                      index: "EDIT_ALL"
                    }))
                  );
                }
                throw error;
              }
            }
          });

          // Check if cleared fields have been requested, make the changes for each operation.
          if (clearedFields?.size) {
            for (const [fieldName, clearType] of clearedFields) {
              _.set(
                saveOp.resource as any,
                fieldName,
                clearType === ClearType.EmptyString ? "" : null
              );
            }
          }

          // Handle relationships in the storage unit
          if (saveOp.resource.storageUnitType) {
            saveOp.resource.storageUnitType = _.pick(
              saveOp.resource.storageUnitType,
              ["id", "type"]
            ) as typeof saveOp.resource.storageUnitType;
          }
          if (saveOp.resource.parentStorageUnit) {
            saveOp.resource.parentStorageUnit = _.pick(
              saveOp.resource.parentStorageUnit,
              ["id", "type"]
            ) as typeof saveOp.resource.parentStorageUnit;
          }

          saveOperations.push(saveOp);
        } catch (error: unknown) {
          if (error instanceof DoOperationsError) {
            // Rethrow the error with the tab's index:
            throw new DoOperationsError(
              error.message,
              error.fieldErrors,
              error.individualErrors.map((operationError) => ({
                ...operationError,
                index:
                  typeof operationError.index === "number"
                    ? index
                    : operationError.index
              }))
            );
          }
          throw error;
        }
      }

      // Do not perform any request if no changes were made.
      const savedStorageUnits = await save<StorageUnit>(
        saveOperations.filter((op) => !isResourceEmpty(op.resource)),
        {
          apiBaseUrl: "/collection-api"
        }
      );
      const savedStorageUnitIds = savedStorageUnits.map(
        (storageUnit) => storageUnit.id
      );

      await onSaved(savedStorageUnitIds);
    } catch (error: unknown) {
      // When there is an error from the bulk save-all operation, put it into the correct form:
      if (error instanceof DoOperationsError) {
        for (const opError of error.individualErrors) {
          const formik =
            typeof opError.index === "number"
              ? resourceHooks[opError.index].formRef.current
              : bulkEditFormRef.current;

          if (formik) {
            formik.setStatus(opError.errorMessage);
            formik.setErrors(opError.fieldErrors);
          }
        }
        // Any errored field that was edited in the Edit All tab should
        // get the red indicator in the Edit All tab.
        const badBulkEditedFields = _.keys(
          _.pickBy(
            error.fieldErrors,
            (_, fieldName) =>
              getBulkEditTabFieldInfo({ bulkEditCtx, fieldName })
                .hasBulkEditValue
          )
        );
        bulkEditFormRef.current?.setErrors({
          ...bulkEditFormRef.current?.errors,
          ..._.pick(error.fieldErrors, badBulkEditedFields)
        });
        // Don't show the bulk edited fields' errors in the individual tabs
        // because the user can't fix them there:
        resourceHooks
          .map((it) => it.formRef?.current)
          .forEach((it) =>
            it?.setErrors(_.omit(it.errors, badBulkEditedFields))
          );
      }
      setError(error);
      throw new Error(formatMessage("bulkSubmissionErrorInfo"));
    }
  }

  return { saveAll };
}
