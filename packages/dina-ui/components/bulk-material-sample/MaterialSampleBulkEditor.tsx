import {
  bulkEditAllManagedAttributes,
  BulkEditTabContextI,
  ButtonBar,
  DinaForm,
  DoOperationsError,
  FormikButton,
  getBulkEditTabFieldInfo,
  isResourceEmpty,
  OperationError,
  ResourceWithHooks,
  SaveArgs,
  suppressUnsavedWarning,
  useApiClient,
  withoutBlankFields
} from "common-ui";
import _ from "lodash";
import { InputResource, PersistedResource, KitsuResource } from "kitsu";
import { useEffect, useMemo, useRef, useState, RefObject } from "react";
import { Promisable } from "type-fest";
import {
  MaterialSampleFormTemplateSelect,
  MaterialSampleForm,
  MaterialSampleFormProps,
  useMaterialSampleFormTemplateSelectState,
  useMaterialSampleSave
} from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import {
  BulkEditNavigator,
  BulkNavigatorTab
} from "../bulk-edit/BulkEditNavigator";
import { useBulkEditTab } from "../bulk-edit/useBulkEditTab";
import { FormikProps } from "formik";
import { VisibleManagedAttributesConfig } from "..";
import {
  CollectingEvent,
  FormTemplate
} from "packages/dina-ui/types/collection-api";
import {
  applyAppendedFields,
  applyClearedFields
} from "../bulk-edit/BulkEditUtils";

export interface MaterialSampleBulkEditorProps {
  samples: InputResource<MaterialSample>[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  disableSampleNameField?: boolean;
  onPreviousClick?: () => void;
  overrideMaterialSampleType?: string;
  initialFormTemplateUUID?: string;
}

export function MaterialSampleBulkEditor({
  samples: samplesProp,
  disableSampleNameField,
  onSaved,
  onPreviousClick,
  initialFormTemplateUUID,
  overrideMaterialSampleType
}: MaterialSampleBulkEditorProps) {
  // Allow selecting a custom view for the form:
  const {
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
  } = useMaterialSampleFormTemplateSelectState({
    temporaryFormTemplateUUID: initialFormTemplateUUID,
    overrideMaterialSampleType
  });

  const [selectedTab, setSelectedTab] = useState<
    BulkNavigatorTab | ResourceWithHooks
  >();

  const {
    bulkEditFormRef,
    bulkEditSampleHook,
    sampleHooks,
    materialSampleForm,
    formTemplateProps,
    bulkEditCollectingEvtFormRef
  }: {
    bulkEditFormRef;
    bulkEditSampleHook;
    sampleHooks: any;
    materialSampleForm: React.JSX.Element;
    formTemplateProps: Partial<MaterialSampleFormProps>;
    bulkEditCollectingEvtFormRef;
  } = useRefHookFormProps(
    samplesProp,
    visibleManagedAttributeKeys,
    selectedTab,
    sampleFormTemplate,
    materialSampleInitialValues,
    collectingEventInitialValues
  );

  const [initialized, setInitialized] = useState(false);
  const { bulkEditTab, clearedFields, deletedFields, appendFields } =
    useBulkEditTab({
      resourceHooks: sampleHooks,
      hideBulkEditTab: !initialized,
      resourceForm: materialSampleForm,
      bulkEditFormRef
    });

  function sampleBulkOverrider() {
    /** Sample input including blank/empty fields. */
    return getSampleBulkOverrider(
      bulkEditFormRef,
      bulkEditSampleHook,
      deletedFields
    );
  }

  useEffect(() => {
    // Set the initial tab to the Edit All tab:
    setSelectedTab(bulkEditTab);
  }, []);

  const { saveAll, submissionError } = useBulkSampleSave({
    onSaved,
    samplePreProcessor: sampleBulkOverrider,
    bulkEditCtx: {
      resourceHooks: sampleHooks,
      bulkEditFormRef,
      clearedFields,
      appendFields
    },
    bulkEditCollectingEvtFormRef,
    bulkEditSampleHook
  });

  const selectedSampleIndex = selectedTab
    ? sampleHooks.findIndex(
        (hook: ResourceWithHooks) => hook.key === selectedTab.key
      )
    : -1;
  const isEditAll = selectedTab?.key === "EDIT_ALL";

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar className="mb-3">
          {onPreviousClick && (
            <div className="col-md-4">
              <FormikButton
                className="btn btn-outline-secondary previous-button"
                onClick={onPreviousClick}
                buttonProps={() => ({ style: { width: "13rem" } })}
              >
                <DinaMessage id="goToThePreviousStep" />
              </FormikButton>
            </div>
          )}
          <div className="col-md-5">
            <div className="mx-auto">
              <MaterialSampleFormTemplateSelect
                value={sampleFormTemplate}
                onChange={setSampleFormTemplateUUID}
              />
            </div>
          </div>
          <div className="col-md-3 flex d-flex">
            <div className="ms-auto">
              <FormikButton
                className="btn btn-primary bulk-save-button"
                onClick={saveAll}
                buttonProps={() => ({ style: { width: "10rem" } })}
              >
                <DinaMessage id="saveAll" />
              </FormikButton>
            </div>
          </div>
        </ButtonBar>
      </DinaForm>
      {selectedTab && (
        <div className="alert alert-info py-2 px-3 mb-2 bulk-edit-status-banner">
          {isEditAll ? (
            <DinaMessage
              id="bulkEditingAllSamples"
              values={{ total: sampleHooks.length }}
            />
          ) : (
            <DinaMessage
              id="bulkEditingSampleOf"
              values={{
                current: selectedSampleIndex + 1,
                total: sampleHooks.length
              }}
            />
          )}
        </div>
      )}
      {selectedTab && (
        <BulkEditNavigator
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          resources={sampleHooks}
          extraTabs={[bulkEditTab]}
          submissionError={submissionError}
          tabNameConfig={(materialSample: ResourceWithHooks<MaterialSample>) =>
            materialSample?.resource?.materialSampleName
          }
          renderOneResource={({ index, isSelected }) => (
            <MaterialSampleForm
              hideUseSequence={true}
              disableSampleNameField={disableSampleNameField}
              materialSampleFormRef={(form) => {
                const isLastRefSetter =
                  sampleHooks.filter((it) => !it.formRef.current).length === 1;
                sampleHooks[index].formRef.current = form;
                if (isLastRefSetter && form) {
                  setInitialized(true);
                }
              }}
              materialSampleSaveHook={sampleHooks[index].saveHook}
              buttonBar={null}
              disableAutoNamePrefix={true}
              isOffScreen={!isSelected}
              reduceRendering={!isSelected}
              {...formTemplateProps}
            />
          )}
        />
      )}
    </div>
  );
}

export function useRefHookFormProps(
  samplesProp,
  visibleManagedAttributeKeys: VisibleManagedAttributesConfig | undefined,
  selectedTab:
    | BulkNavigatorTab<KitsuResource>
    | ResourceWithHooks<KitsuResource>
    | undefined,
  formTemplate: FormTemplate | undefined,
  materialSampleInitialValues,
  collectingEventInitialValues
) {
  // Make sure the samples list doesn't change during this component's lifecycle:
  const samples = useMemo(() => samplesProp, []);

  const formTemplateProps: Partial<MaterialSampleFormProps> = {
    visibleManagedAttributeKeys,
    formTemplate
  };

  const initialValues: InputResource<MaterialSample> = {
    type: "material-sample"
  };

  const bulkEditFormRef =
    useRef<FormikProps<InputResource<MaterialSample>>>(null);
  const bulkEditCollectingEvtFormRef =
    useRef<FormikProps<InputResource<CollectingEvent>>>(null);

  // don't use form template's materialSampleName default value for bulk edit
  delete materialSampleInitialValues?.materialSampleName;
  const bulkEditSampleHook = useMaterialSampleSave({
    ...formTemplateProps,
    materialSample: materialSampleInitialValues ?? initialValues,
    collectingEventInitialValues,
    showChangedIndicatorsInNestedForms: true,
    disableNestedFormEdits: true,
    colEventFormRef: bulkEditCollectingEvtFormRef
  });

  const sampleHooks = getSampleHooks(
    samples,
    selectedTab,
    visibleManagedAttributeKeys
  );

  const materialSampleForm = getMaterialSampleForm(
    formTemplateProps,
    bulkEditFormRef,
    bulkEditSampleHook,
    initialValues,
    sampleHooks
  );
  return {
    bulkEditFormRef,
    bulkEditSampleHook,
    sampleHooks,
    materialSampleForm,
    formTemplateProps,
    bulkEditCollectingEvtFormRef
  };
}

function getSampleHooks(
  samples,
  selectedTab:
    | BulkNavigatorTab<KitsuResource>
    | ResourceWithHooks<KitsuResource>
    | undefined,
  visibleManagedAttributeKeys: VisibleManagedAttributesConfig | undefined
) {
  return samples.map((resource, index) => {
    const key = `sample-${index}`;
    return {
      key,
      resource,
      saveHook: useMaterialSampleSave({
        materialSample: resource,
        // Reduce the off-screen tabs rendering for better performance:
        reduceRendering: key !== selectedTab?.key,
        // Don't allow editing existing Col events in the individual sample tabs to avoid conflicts.
        disableNestedFormEdits: true,
        visibleManagedAttributeKeys
      }),
      formRef: useRef(null)
    };
  });
}

export function getSampleBulkOverrider(
  bulkEditFormRef,
  bulkEditSampleHook,
  deletedFields?: Set<string>
) {
  let bulkEditSample: InputResource<MaterialSample> | undefined;

  /** Returns a sample with the overridden values. */
  return async function withBulkEditOverrides(
    baseSample: InputResource<MaterialSample>
  ) {
    const formik = bulkEditFormRef.current;
    // Shouldn't happen, but check for type safety:
    if (!formik) {
      throw new Error("Missing Formik ref for Bulk Edit Tab");
    }

    // Initialize the bulk values once to make sure the same object is used each time.
    if (!bulkEditSample) {
      bulkEditSample = await bulkEditSampleHook.prepareSampleInput(
        formik.values
      );
    }

    /** Sample override object with only the non-empty fields. */
    const overrides = withoutBlankFields(bulkEditSample, formik.values);
    delete overrides.managedAttributes; // Handled separately below.
    delete overrides.preparationManagedAttributes; // Handled separately below.
    delete overrides.associations; // Handled separately below.

    // Material Sample Managed Attribute Handling:
    const materialSampleManagedAttributes = bulkEditAllManagedAttributes(
      bulkEditSample?.managedAttributes ?? {},
      baseSample.managedAttributes ?? {},
      deletedFields ?? new Set(),
      "managedAttributes"
    );

    // Preparation Managed Attribute Handling
    const preparedManagedAttributes = bulkEditAllManagedAttributes(
      bulkEditSample?.preparationManagedAttributes ?? {},
      baseSample.preparationManagedAttributes ?? {},
      deletedFields ?? new Set(),
      "preparationManagedAttributes"
    );

    const newHostOrganism = {
      ...withoutBlankFields(baseSample.hostOrganism),
      ...withoutBlankFields(bulkEditSample?.hostOrganism)
    };

    // Handle associations...
    const bulkAssociations = formik.values.associations;

    const hasNonEmptyBulkAssociations = bulkAssociations?.some(
      (assoc) =>
        assoc.associatedSample || assoc.associationType || assoc.remarks
    );

    const mergedAssociations =
      bulkEditSampleHook.dataComponentState.enableAssociations &&
      hasNonEmptyBulkAssociations
        ? bulkAssociations
        : baseSample.associations;

    const newSample: InputResource<MaterialSample> = {
      ...baseSample,
      ...overrides,
      ...(!_.isEmpty(materialSampleManagedAttributes) && {
        managedAttributes: materialSampleManagedAttributes
      }),
      ...(!_.isEmpty(preparedManagedAttributes) && {
        preparationManagedAttributes: preparedManagedAttributes
      }),
      ...(!_.isEmpty(newHostOrganism) && {
        hostOrganism: newHostOrganism
      }),
      ...(mergedAssociations !== undefined && {
        associations: mergedAssociations
      })
    };

    return newSample;
  };
}

function getMaterialSampleForm(
  formTemplateProps: Partial<MaterialSampleFormProps>,
  bulkEditFormRef,
  bulkEditSampleHook,
  initialValues,
  sampleHooks: ResourceWithHooks<KitsuResource>[]
) {
  return (
    <MaterialSampleForm
      {...formTemplateProps}
      enableReinitialize={formTemplateProps.formTemplate ? true : false}
      buttonBar={null}
      hideUseSequence={true}
      materialSampleFormRef={bulkEditFormRef}
      materialSampleSaveHook={bulkEditSampleHook}
      materialSample={initialValues}
      disableAutoNamePrefix={true}
      disableSampleNameField={true}
      disableCollectingEventSwitch={sampleHooks.some(
        (hook: any) => hook.resource?.parentMaterialSample !== undefined
      )}
      // Disable the nav's Are You Sure prompt when removing components,
      // because you aren't actually deleting data.
      disableNavRemovePrompt={true}
      isBulkEditAllTab={true}
    />
  );
}

interface BulkSampleSaveParams {
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  samplePreProcessor?: () => (
    sample: InputResource<MaterialSample>
  ) => Promise<InputResource<MaterialSample>>;
  bulkEditCtx: BulkEditTabContextI<MaterialSample>;
  bulkEditCollectingEvtFormRef: RefObject<
    FormikProps<InputResource<CollectingEvent>>
  >;
  bulkEditSampleHook: any;
}

/**
 * Provides a "save" method to bulk save the samples in one database transaction
 * with try/catch error handling to put the error indicators on the correct tab.
 */
function useBulkSampleSave({
  onSaved,
  samplePreProcessor,
  bulkEditCtx,
  bulkEditCollectingEvtFormRef,
  bulkEditSampleHook
}: BulkSampleSaveParams) {
  // Force re-render when there is a bulk submission error:
  const [submissionError, setSubmissionError] = useState<unknown | null>(null);
  const [erroredTabKeys, setErroredTabKeys] = useState<string[]>([]);
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const {
    bulkEditFormRef,
    resourceHooks: sampleHooks,
    clearedFields,
    appendFields
  } = bulkEditCtx;

  async function saveAll() {
    setSubmissionError(null);
    setErroredTabKeys([]);
    bulkEditFormRef.current?.setStatus(null);
    bulkEditFormRef.current?.setErrors({});

    const bulkEditCollectingEventRefPermanent = bulkEditSampleHook
      ?.colEventFormRef?.current?.values
      ? _.cloneDeep(bulkEditCollectingEvtFormRef)
      : undefined;

    try {
      // First clear all tab errors:
      for (const { formRef } of sampleHooks) {
        formRef.current?.setStatus(null);
        formRef.current?.setErrors({});
      }

      const preProcessSample = samplePreProcessor?.();

      const saveOperations: SaveArgs<MaterialSample>[] = [];
      const submittedValuesList: InputResource<MaterialSample>[] = [];

      // 1. COLLECT ERRORS instead of throwing immediately to prevent loop from aborting
      const prepareErrors: OperationError[] = [];

      for (let index = 0; index < sampleHooks.length; index++) {
        const { formRef, resource, saveHook } = sampleHooks[index];
        const formik = formRef.current;

        if (!formik) {
          throw new Error(
            `Missing Formik ref for sample ${resource.materialSampleName}`
          );
        }

        try {
          const processedSample = preProcessSample
            ? await preProcessSample(formik.values)
            : formik.values;

          submittedValuesList.push(processedSample);

          // Determine if the collecting event override is being set on a bulk edit or individual tab.
          const getOverrideCollectingEventUUID = () => {
            if (bulkEditSampleHook.overrideCollectingEvent) {
              return bulkEditCollectingEventRefPermanent?.current?.values?.id;
            }
            if (saveHook?.overrideCollectingEvent) {
              return formik?.values?.collectingEvent?.id;
            }
            return undefined;
          };

          const saveOp = await saveHook.prepareSampleSaveOperation({
            submittedValues: formik.values,
            preProcessSample: async (original) => {
              try {
                return (await preProcessSample?.(original)) ?? original;
              } catch (error: unknown) {
                if (error instanceof DoOperationsError) {
                  throw new DoOperationsError(
                    error.message,
                    error.fieldErrors,
                    error.individualErrors.map((opError) => ({
                      ...opError,
                      index: "EDIT_ALL"
                    }))
                  );
                }
                setSubmissionError(error);
                throw error;
              }
            },
            collectingEventRefExternal: bulkEditSampleHook.dataComponentState
              .enableCollectingEvent
              ? bulkEditCollectingEventRefPermanent
              : undefined,
            unlinkCollectingEvent:
              bulkEditSampleHook.unlinkCollectingEvent ||
              saveHook.unlinkCollectingEvent,
            overrideCollectingEventUUID: getOverrideCollectingEventUUID()
          });

          // Handle Bulk Editor special functionality
          applyClearedFields(saveOp.resource, clearedFields);
          applyAppendedFields(saveOp.resource, resource, appendFields);

          saveOperations.push(saveOp);
        } catch (error: unknown) {
          if (error instanceof DoOperationsError) {
            // Accumulate errors for this tab, then continue the loop
            prepareErrors.push(
              ...error.individualErrors.map((operationError) => ({
                ...operationError,
                index:
                  typeof operationError.index === "number"
                    ? index
                    : operationError.index
              }))
            );
          } else {
            setSubmissionError(error);
            throw error;
          }
        }
      }

      // If ANY prepare operations failed across ANY tabs, throw them all together now
      if (prepareErrors.length > 0) {
        throw new DoOperationsError(
          _.compact(prepareErrors.map((e) => e.errorMessage)).join("\n") || "",
          prepareErrors.reduce(
            (acc, curr) => ({ ...acc, ...curr.fieldErrors }),
            {}
          ),
          prepareErrors
        );
      }

      const nonEmptyOperations: SaveArgs<MaterialSample>[] = [];
      const nonEmptyIndices: number[] = [];
      const resultSamples: PersistedResource<MaterialSample>[] = new Array(
        saveOperations.length
      );

      for (let i = 0; i < saveOperations.length; i++) {
        const operation = saveOperations[i];

        if (isResourceEmpty(operation.resource)) {
          resultSamples[i] = operation.resource as any;
        } else {
          nonEmptyOperations.push(operation);
          nonEmptyIndices.push(i);
        }
      }

      if (nonEmptyOperations.length > 0) {
        let savedSamples: PersistedResource<MaterialSample>[];
        try {
          savedSamples = await save<MaterialSample>(nonEmptyOperations, {
            apiBaseUrl: "/collection-api"
          });
        } catch (error: unknown) {
          if (error instanceof DoOperationsError) {
            throw new DoOperationsError(
              error.message,
              error.fieldErrors,
              error.individualErrors.map((opError) => ({
                ...opError,
                index:
                  typeof opError.index === "number"
                    ? nonEmptyIndices[opError.index] ?? opError.index
                    : opError.index
              }))
            );
          }
          throw error;
        }

        for (let i = 0; i < savedSamples.length; i++) {
          const originalIndex = nonEmptyIndices[i];
          resultSamples[originalIndex] = savedSamples[i];
        }
      }

      // 2. COLLECT ASSOCIATION ERRORS to prevent this loop from aborting early too
      const assocErrors: OperationError[] = [];

      for (let i = 0; i < sampleHooks.length; i++) {
        const { saveHook } = sampleHooks[i];
        const savedSample = resultSamples[i];
        const submittedValues = submittedValuesList[i];

        if (
          saveHook.dataComponentState.enableAssociations ||
          saveHook.dataComponentState.deleteAssociations
        ) {
          try {
            await saveHook.saveAssociations({
              ...submittedValues,
              id: savedSample.id
            });
          } catch (error: unknown) {
            if (error instanceof DoOperationsError) {
              assocErrors.push(
                ...error.individualErrors.map((operationError) => ({
                  ...operationError,
                  index: i
                }))
              );
            } else {
              throw error;
            }
          }
        }
      }

      // If ANY association operations failed, throw them together
      if (assocErrors.length > 0) {
        throw new DoOperationsError(
          _.compact(assocErrors.map((e) => e.errorMessage)).join("\n") || "",
          assocErrors.reduce(
            (acc, curr) => ({ ...acc, ...curr.fieldErrors }),
            {}
          ),
          assocErrors
        );
      }
      // Suppress unsaved data warning before navigating
      suppressUnsavedWarning();
      // Reset form dirty states for good measure
      bulkEditFormRef.current?.resetForm({
        values: bulkEditFormRef.current.values
      });
      for (const { formRef } of sampleHooks) {
        formRef.current?.resetForm({ values: formRef.current.values });
      }

      await onSaved(resultSamples);
    } catch (error: unknown) {
      // 3. Calculate the exact errors in memory, then set them once per form.
      if (error instanceof DoOperationsError) {
        const badBulkEditedFields = _.keys(
          _.pickBy(
            error.fieldErrors,
            (_, fieldName) =>
              getBulkEditTabFieldInfo({ bulkEditCtx, fieldName })
                .hasBulkEditValue
          )
        );

        const editAllErrors = {
          ...bulkEditFormRef.current?.errors,
          ..._.pick(error.fieldErrors, badBulkEditedFields)
        };
        let editAllStatus = bulkEditFormRef.current?.status;

        const finalFormErrors: Record<string, any> = {};
        const finalFormStatuses: Record<string, any> = {};

        for (const opError of error.individualErrors) {
          if (typeof opError.index === "number") {
            const tabKey = `sample-${opError.index}`;
            const remainingErrors = _.omit(
              opError.fieldErrors,
              badBulkEditedFields
            );
            finalFormErrors[tabKey] = {
              ...(finalFormErrors[tabKey] || {}),
              ...remainingErrors
            };

            if (opError.errorMessage) {
              finalFormStatuses[tabKey] = finalFormStatuses[tabKey]
                ? finalFormStatuses[tabKey] + "\n" + opError.errorMessage
                : opError.errorMessage;
            }
          } else if (opError.index === "EDIT_ALL") {
            editAllStatus = editAllStatus
              ? editAllStatus + "\n" + opError.errorMessage
              : opError.errorMessage;
          }
        }

        // Apply Edit All errors
        bulkEditFormRef.current?.setErrors(editAllErrors);
        bulkEditFormRef.current?.setStatus(editAllStatus || null);

        const keys: string[] = [];

        // Apply individual tab errors safely
        sampleHooks.forEach((hook, index) => {
          const tabKey = `sample-${index}`;
          const formik = hook.formRef.current;
          if (formik) {
            const errs = finalFormErrors[tabKey] || {};
            // Merge old errors (excluding bulk edits) with new incoming errors
            const retainedOldErrors = _.omit(
              formik.errors,
              badBulkEditedFields
            );
            const combinedErrors = { ...retainedOldErrors, ...errs };

            formik.setErrors(combinedErrors);
            formik.setStatus(finalFormStatuses[tabKey] || null);

            if (!_.isEmpty(combinedErrors) || finalFormStatuses[tabKey]) {
              keys.push(tabKey);
            }
          }
        });

        if (!_.isEmpty(editAllErrors) || editAllStatus) {
          keys.push("EDIT_ALL");
        }

        setErroredTabKeys(keys);
        setSubmissionError(error);
        throw new Error(formatMessage("bulkSubmissionErrorInfo"));
      } else {
        setSubmissionError(error);
        throw new Error(formatMessage("bulkSubmissionErrorInfo"));
      }
    }
  }

  return { saveAll, submissionError, erroredTabKeys };
}
