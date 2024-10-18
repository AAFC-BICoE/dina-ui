import React from "react";
import { InputResource, PersistedResource, KitsuResource } from "kitsu";
import { Promisable } from "type-fest";
import {
  BulkEditTabContextI,
  ButtonBar,
  DinaForm,
  DoOperationsError,
  FormikButton,
  getBulkEditTabFieldInfo,
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
import { useMetadataSave } from "../object-store/metadata/useMetadata";
import { MetadataForm } from "../object-store/metadata/MetadataForm";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { isEmpty, keys, omit, pick, pickBy } from "lodash";
import { useBulkEditTab } from "../bulk-edit/useBulkEditTab";
import { StorageUnit } from "packages/dina-ui/types/collection-api";
import { StorageUnitForm } from "./StorageUnitForm";

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
      saveHook: useMetadataSave({
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

  // Make sure the metadatas list doesn't change during this component's lifecycle:
  const storageUnits = useMemo(() => storageUnitsProp, []);

  const initialValues: InputResource<StorageUnit> = {
    type: "storage-unit",
    group: ""
  };

  const bulkEditStorageUnitHook = useMetadataSave({
    initialValues
  });

  const bulkEditFormRef = useRef<FormikProps<InputResource<StorageUnit>>>(null);

  const storageUnitHooks = getStorageUnitHooks(storageUnits);

  const bulkEditTabStorageUnitForm = (
    <StorageUnitForm
      storageUnit={initialValues as any}
      storageUnitFormRef={bulkEditFormRef}
      storageUnitSaveHook={bulkEditStorageUnitHook}
    />
  );

  function metadataBulkOverrider() {
    /** Metadata input including blank/empty fields. */
    return getStorageUnitBulkOverrider(bulkEditFormRef);
  }

  const [initialized, setInitialized] = useState(false);

  const { bulkEditTab } = useBulkEditTab({
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
    storageUnitPreProcessor: metadataBulkOverrider,
    bulkEditCtx: { resourceHooks: storageUnitHooks, bulkEditFormRef }
  });

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar className="gap-4">
          {onPreviousClick && (
            <div className="flex-grow-1">
              <div className="mx-auto">
                <FormikButton
                  className="btn btn-outline-secondary previous-button"
                  onClick={onPreviousClick}
                  buttonProps={() => ({ style: { width: "13rem" } })}
                >
                  <DinaMessage id="goToThePreviousStep" />
                </FormikButton>
              </div>
            </div>
          )}
          <FormikButton
            className="btn btn-primary bulk-save-button"
            onClick={saveAll}
            buttonProps={() => ({ style: { width: "10rem" } })}
          >
            <DinaMessage id="saveAll" />
          </FormikButton>
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
          renderOneResource={({ index, isSelected }) => (
            <MetadataForm
              metadataFormRef={(form) => {
                const isLastRefSetter =
                  storageUnitHooks.filter((it) => !it.formRef.current)
                    .length === 1;
                storageUnitHooks[index].formRef.current = form;
                if (isLastRefSetter && form) {
                  setInitialized(true);
                }
              }}
              metadataSaveHook={storageUnitHooks[index].saveHook}
              buttonBar={null}
              isOffScreen={!isSelected}
              reduceRendering={!isSelected}
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
    const overrides = withoutBlankFields(bulkEditStorageUnit);

    // Combine the managed attributes dictionaries:
    // const newManagedAttributes = {
    //   ...withoutBlankFields(baseStorageUnit.managedAttributes),
    //   ...withoutBlankFields(bulkEditStorageUnit?.managedAttributes)
    // };

    const newStorageUnit: InputResource<StorageUnit> = {
      ...baseStorageUnit,
      ...overrides
      //   ...(!isEmpty(newManagedAttributes) && {
      //     managedAttributes: newManagedAttributes
      //   })
    };

    return newStorageUnit;
  };
}

interface BulkStorageUnitSaveParams {
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  storageUnitPreProcessor?: () => (
    metadata: InputResource<StorageUnit>
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
  const { save, apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const { bulkEditFormRef, resourceHooks } = bulkEditCtx;

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
          if (saveOp.resource.license) {
            // The Metadata's xmpRightsWebStatement field stores the license's url.
            saveOp.resource.xmpRightsWebStatement =
              saveOp.resource.license?.url ?? "";
            // No need to store this ; The url should be enough.
            saveOp.resource.xmpRightsUsageTerms = "";
          }
          delete saveOp.resource.license;
          saveOp.resource.acSubtype =
            saveOp.resource.acSubtype?.acSubtype ?? null;

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

      const savedStorageUnits = await save<StorageUnit>(saveOperations, {
        apiBaseUrl: "/collection/storage-unit"
      });
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
        const badBulkEditedFields = keys(
          pickBy(
            error.fieldErrors,
            (_, fieldName) =>
              getBulkEditTabFieldInfo({ bulkEditCtx, fieldName })
                .hasBulkEditValue
          )
        );
        bulkEditFormRef.current?.setErrors({
          ...bulkEditFormRef.current?.errors,
          ...pick(error.fieldErrors, badBulkEditedFields)
        });
        // Don't show the bulk edited fields' errors in the individual tabs
        // because the user can't fix them there:
        resourceHooks
          .map((it) => it.formRef?.current)
          .forEach((it) => it?.setErrors(omit(it.errors, badBulkEditedFields)));
      }
      setError(error);
      throw new Error(formatMessage("bulkSubmissionErrorInfo"));
    }
  }

  return { saveAll };
}
