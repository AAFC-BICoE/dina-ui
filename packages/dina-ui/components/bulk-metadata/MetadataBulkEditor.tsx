import React from "react";
import { License, Metadata } from "../../types/objectstore-api";
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
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl"; // "packages/dina-ui/intl/dina-ui-intl"
import { isEmpty, keys, omit, pick, pickBy } from "lodash";
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

  function metadataBulkOverrider() {
    /** Metadata input including blank/empty fields. */
    return getMetadataBulkOverrider(bulkEditFormRef);
  }

  const [initialized, setInitialized] = useState(false);

  const { bulkEditTab } = useBulkEditTab({
    resourceHooks: metadataHooks,
    hideBulkEditTab: !initialized,
    resourceForm: metadataForm,
    bulkEditFormRef
  });

  useEffect(() => {
    // Set the initial tab to the Edit All tab:
    setSelectedTab(bulkEditTab);
  }, []);

  const { saveAll } = useBulkMetadataSave({
    onSaved,
    metadataPreProcessor: metadataBulkOverrider,
    bulkEditCtx: { resourceHooks: metadataHooks, bulkEditFormRef }
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
          resources={metadataHooks}
          extraTabs={[bulkEditTab]}
          tabNameConfig={(metadata: ResourceWithHooks<Metadata>) =>
            metadata?.resource?.originalFilename
          }
          renderOneResource={({ index, isSelected }) => (
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
              isOffScreen={!isSelected}
              reduceRendering={!isSelected}
            />
          )}
        />
      )}
    </div>
  );
}

export function getMetadataBulkOverrider(bulkEditFormRef) {
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

    /** Override object with only the non-empty fields. */
    const overrides = withoutBlankFields(bulkEditMetadata);

    // Combine the managed attributes dictionaries:
    const newManagedAttributes = {
      ...withoutBlankFields(baseMetadata.managedAttributes),
      ...withoutBlankFields(bulkEditMetadata?.managedAttributes)
    };

    const newMetadata: InputResource<Metadata> = {
      ...baseMetadata,
      ...overrides,
      ...(!isEmpty(newManagedAttributes) && {
        managedAttributes: newManagedAttributes
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
  const { save, apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const { bulkEditFormRef, resourceHooks: metadataHooks } = bulkEditCtx;

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
          const {
            // Don't include derivatives in the form submission:
            derivatives,
            ...metadataValues
          } = submittedValues;

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

      const savedMetadata = await save<Metadata>(saveOperations, {
        apiBaseUrl: "/objectstore-api"
      });
      const savedMetadataIds = savedMetadata.map((metadata) => metadata.id);

      await onSaved(savedMetadataIds);
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
        metadataHooks
          .map((it) => it.formRef?.current)
          .forEach((it) => it?.setErrors(omit(it.errors, badBulkEditedFields)));
      }
      setError(error);
      throw new Error(formatMessage("bulkSubmissionErrorInfo"));
    }
  }

  return { saveAll };
}
