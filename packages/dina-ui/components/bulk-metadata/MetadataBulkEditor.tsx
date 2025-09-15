import React, { useCallback } from "react";
import { Metadata } from "../../types/objectstore-api";
import { InputResource, PersistedResource } from "kitsu";
import {
  bulkEditAllManagedAttributes,
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
import { useMetadataSave } from "../object-store/metadata/useMetadata";
import { MetadataForm } from "../object-store/metadata/MetadataForm";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl"; // "packages/dina-ui/intl/dina-ui-intl"
import _ from "lodash";
import { useBulkEditTab } from "../bulk-edit/useBulkEditTab";

export interface MetadataBulkEditorProps {
  metadatas: InputResource<Metadata>[];
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  disableMetadataNameField?: boolean;
  onPreviousClick?: () => void;
}
function getMetadataHooks(metadatas) {
  return metadatas.map((resource, index) => {
    const key = `metadata-${index}`;
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

export function MetadataBulkEditor({
  metadatas: metadatasProp,
  onPreviousClick,
  onSaved
}: MetadataBulkEditorProps) {
  const [selectedTab, setSelectedTab] = useState<
    BulkNavigatorTab | ResourceWithHooks
  >();

  // Make sure the metadatas list doesn't change during this component's lifecycle:
  const metadatas = useMemo(() => metadatasProp, []);

  const initialValues: InputResource<Metadata> = {
    type: "metadata",
    group: ""
  };

  const bulkEditMetadataHook = useMetadataSave({
    initialValues
  });

  const bulkEditFormRef = useRef<FormikProps<InputResource<Metadata>>>(null);

  const metadataHooks = getMetadataHooks(metadatas);

  const metadataForm = (
    <MetadataForm
      metadata={initialValues}
      buttonBar={null}
      metadataFormRef={bulkEditFormRef}
      metadataSaveHook={bulkEditMetadataHook}
    />
  );

  const [initialized, setInitialized] = useState(false);

  const { bulkEditTab, clearedFields, deletedFields } = useBulkEditTab({
    resourceHooks: metadataHooks,
    hideBulkEditTab: !initialized,
    resourceForm: metadataForm,
    bulkEditFormRef
  });

  const metadataBulkOverrider = useCallback(
    () => getMetadataBulkOverrider(bulkEditFormRef, deletedFields),
    [bulkEditFormRef, deletedFields]
  );

  useEffect(() => {
    // Set the initial tab to the Edit All tab:
    setSelectedTab(bulkEditTab);
  }, []);

  const { saveAll } = useBulkMetadataSave({
    onSaved,
    metadataPreProcessor: metadataBulkOverrider,
    bulkEditCtx: {
      resourceHooks: metadataHooks,
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
          resources={metadataHooks}
          extraTabs={[bulkEditTab]}
          tabNameConfig={(metadata: ResourceWithHooks<Metadata>) =>
            metadata?.resource?.originalFilename
          }
          renderOneResource={({ index }) => (
            <MetadataForm
              metadataFormRef={(form) => {
                const isLastRefSetter =
                  metadataHooks.filter((it) => !it.formRef.current).length ===
                  1;
                metadataHooks[index].formRef.current = form;
                if (isLastRefSetter && form) {
                  setInitialized(true);
                }
              }}
              metadataSaveHook={metadataHooks[index].saveHook}
              buttonBar={null}
            />
          )}
        />
      )}
    </div>
  );
}

export function getMetadataBulkOverrider(
  bulkEditFormRef,
  deletedFields?: Set<string>
) {
  let bulkEditMetadata: InputResource<Metadata> | undefined;

  /** Returns an object with the overridden values. */
  return async function withBulkEditOverrides(
    baseMetadata: InputResource<Metadata>
  ) {
    const formik = bulkEditFormRef.current;
    // Shouldn't happen, but check for type safety:
    if (!formik) {
      throw new Error("Missing Formik ref for Bulk Edit Tab");
    }

    // Initialize the bulk values once to make sure the same object is used each time.
    if (!bulkEditMetadata) {
      bulkEditMetadata = formik.values;
    }

    const overrides = withoutBlankFields({ ...bulkEditMetadata });
    delete overrides.managedAttributes; // handled separately below

    const metadataManagedAttributes = bulkEditAllManagedAttributes(
      bulkEditMetadata?.managedAttributes ?? {},
      baseMetadata.managedAttributes ?? {},
      deletedFields ?? new Set(),
      "managedAttributes"
    );

    const newMetadata: InputResource<Metadata> = {
      ...baseMetadata,
      ...overrides,
      ...(!_.isEmpty(metadataManagedAttributes) && {
        managedAttributes: metadataManagedAttributes
      })
    };

    return newMetadata;
  };
}

interface BulkMetadataSaveParams {
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  metadataPreProcessor?: () => (
    metadata: InputResource<Metadata>
  ) => Promise<InputResource<Metadata>>;
  bulkEditCtx: BulkEditTabContextI<Metadata>;
}

/**
 * Provides a "save" method to bulk save the in one database transaction
 * with try/catch error handling to put the error indicators on the correct tab.
 */
function useBulkMetadataSave({
  onSaved,
  metadataPreProcessor,
  bulkEditCtx
}: BulkMetadataSaveParams) {
  // Force re-render when there is a bulk submission error:
  const [_error, setError] = useState<unknown | null>(null);
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const {
    bulkEditFormRef,
    resourceHooks: metadataHooks,
    clearedFields
  } = bulkEditCtx;

  async function saveAll() {
    setError(null);
    bulkEditFormRef.current?.setStatus(null);
    bulkEditFormRef.current?.setErrors({});

    try {
      // First clear all tab errors:
      for (const { formRef } of metadataHooks) {
        formRef.current?.setStatus(null);
        formRef.current?.setErrors({});
      }

      const preProcessMetadata = metadataPreProcessor?.();

      // To be saved to back-end
      const saveOperations: SaveArgs<Metadata>[] = [];
      for (let index = 0; index < metadataHooks.length; index++) {
        const { formRef, resource, saveHook } = metadataHooks[index];
        const formik = formRef.current;

        // These two errors shouldn't happen:
        if (!formik) {
          throw new Error(
            `Missing Formik ref for ${resource.originalFilename}`
          );
        }

        try {
          const submittedValues = formik.values;
          // Don't include derivatives in the form submission:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { derivatives, ...metadataValues } = submittedValues;

          const saveOp = await saveHook.prepareMetadataSaveOperation({
            submittedValues: metadataValues,
            preProcessMetadata: async (original) => {
              try {
                return (await preProcessMetadata?.(original)) ?? original;
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

      // Filter out empty resources but keep track of their positions
      const nonEmptyOperations: SaveArgs<Metadata>[] = [];
      const nonEmptyIndices: number[] = [];
      const resultMetadata: PersistedResource<Metadata>[] = new Array(
        saveOperations.length
      );

      // First pass: store empty resources and collect non-empty ones
      for (let i = 0; i < saveOperations.length; i++) {
        const operation = saveOperations[i];

        if (isResourceEmpty(operation.resource)) {
          // For empty resources, just store the original resource
          resultMetadata[i] = operation.resource as any;
        } else {
          // For non-empty resources, collect for batch save
          nonEmptyOperations.push(operation);
          nonEmptyIndices.push(i);
        }
      }

      // Make a single API call for all non-empty resources
      if (nonEmptyOperations.length > 0) {
        const savedMetadata = await save<Metadata>(nonEmptyOperations, {
          apiBaseUrl: "/objectstore-api"
        });

        // Place the saved resources in their original positions
        for (let i = 0; i < savedMetadata.length; i++) {
          const originalIndex = nonEmptyIndices[i];
          resultMetadata[originalIndex] = savedMetadata[i];
        }
      }

      // Call onSaved with all samples in the original order
      await onSaved(resultMetadata.map((metadata) => metadata.id));
    } catch (error: unknown) {
      // When there is an error from the bulk save-all operation, put it into the correct form:
      if (error instanceof DoOperationsError) {
        for (const opError of error.individualErrors) {
          const formik =
            typeof opError.index === "number"
              ? metadataHooks[opError.index].formRef.current
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
        metadataHooks
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
