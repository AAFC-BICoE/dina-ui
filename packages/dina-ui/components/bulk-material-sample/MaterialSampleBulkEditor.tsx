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
import { isEmpty } from "lodash";
import { InputResource, PersistedResource, KitsuResource } from "kitsu";
import { keys, omit, pick, pickBy } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { FormTemplate } from "packages/dina-ui/types/collection-api";

export interface MaterialSampleBulkEditorProps {
  samples: InputResource<MaterialSample>[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  disableSampleNameField?: boolean;
  onPreviousClick?: () => void;
  initialFormTemplateUUID?: string;
}

export function MaterialSampleBulkEditor({
  samples: samplesProp,
  disableSampleNameField,
  onSaved,
  onPreviousClick,
  initialFormTemplateUUID
}: MaterialSampleBulkEditorProps) {
  // Allow selecting a custom view for the form:
  const {
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
  } = useMaterialSampleFormTemplateSelectState({
    temporaryFormTemplateUUID: initialFormTemplateUUID
  });

  const [selectedTab, setSelectedTab] = useState<
    BulkNavigatorTab | ResourceWithHooks
  >();

  const {
    bulkEditFormRef,
    bulkEditSampleHook,
    sampleHooks,
    materialSampleForm,
    formTemplateProps
  }: {
    bulkEditFormRef;
    bulkEditSampleHook;
    sampleHooks: any;
    materialSampleForm: JSX.Element;
    formTemplateProps: Partial<MaterialSampleFormProps>;
  } = initializeRefHookFormProps(
    samplesProp,
    visibleManagedAttributeKeys,
    selectedTab,
    sampleFormTemplate,
    materialSampleInitialValues,
    collectingEventInitialValues
  );
  function sampleBulkOverrider() {
    /** Sample input including blank/empty fields. */
    return getSampleBulkOverrider(bulkEditFormRef, bulkEditSampleHook);
  }
  const [initialized, setInitialized] = useState(false);
  const { bulkEditTab } = useBulkEditTab({
    resourceHooks: sampleHooks,
    hideBulkEditTab: !initialized,
    resourceForm: materialSampleForm,
    bulkEditFormRef
  });

  useEffect(() => {
    // Set the initial tab to the Edit All tab:
    setSelectedTab(bulkEditTab);
  }, []);

  const { saveAll } = useBulkSampleSave({
    onSaved,
    samplePreProcessor: sampleBulkOverrider,
    bulkEditCtx: { resourceHooks: sampleHooks, bulkEditFormRef }
  });

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar className="gap-4">
          {onPreviousClick && (
            <FormikButton
              className="btn btn-outline-secondary previous-button"
              onClick={onPreviousClick}
              buttonProps={() => ({ style: { width: "13rem" } })}
            >
              <DinaMessage id="goToThePreviousStep" />
            </FormikButton>
          )}
          <div className="flex-grow-1">
            <div className="mx-auto">
              <MaterialSampleFormTemplateSelect
                value={sampleFormTemplate}
                onChange={setSampleFormTemplateUUID}
              />
            </div>
          </div>
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
          resources={sampleHooks}
          extraTabs={[bulkEditTab]}
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

interface BulkSampleSaveParams {
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  samplePreProcessor?: () => (
    sample: InputResource<MaterialSample>
  ) => Promise<InputResource<MaterialSample>>;
  bulkEditCtx: BulkEditTabContextI<MaterialSample>;
}

export function initializeRefHookFormProps(
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

  // don't use form template's materialSampleName default value for bulk edit
  delete materialSampleInitialValues?.materialSampleName;
  const bulkEditSampleHook = useMaterialSampleSave({
    ...formTemplateProps,
    materialSample: materialSampleInitialValues ?? initialValues,
    collectingEventInitialValues,
    showChangedIndicatorsInNestedForms: true
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
    formTemplateProps
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

export function getSampleBulkOverrider(bulkEditFormRef, bulkEditSampleHook) {
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
    const overrides = withoutBlankFields(bulkEditSample);

    // Combine the managed attributes dictionaries:
    const newManagedAttributes = {
      ...withoutBlankFields(baseSample.managedAttributes),
      ...withoutBlankFields(bulkEditSample?.managedAttributes)
    };

    const newHostOrganism = {
      ...withoutBlankFields(baseSample.hostOrganism),
      ...withoutBlankFields(bulkEditSample?.hostOrganism)
    };

    const newSample: InputResource<MaterialSample> = {
      ...baseSample,
      ...overrides,
      ...(!isEmpty(newManagedAttributes) && {
        managedAttributes: newManagedAttributes
      }),
      ...(!isEmpty(newHostOrganism) && {
        hostOrganism: newHostOrganism
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
    />
  );
}

/**
 * Provides a "save" method to bulk save the samples in one database transaction
 * with try/catch error handling to put the error indicators on the correct tab.
 */
function useBulkSampleSave({
  onSaved,
  samplePreProcessor,
  bulkEditCtx
}: BulkSampleSaveParams) {
  // Force re-render when there is a bulk submission error:
  const [_error, setError] = useState<unknown | null>(null);
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const { bulkEditFormRef, resourceHooks: sampleHooks } = bulkEditCtx;

  async function saveAll() {
    setError(null);
    bulkEditFormRef.current?.setStatus(null);
    bulkEditFormRef.current?.setErrors({});
    try {
      // First clear all tab errors:
      for (const { formRef } of sampleHooks) {
        formRef.current?.setStatus(null);
        formRef.current?.setErrors({});
      }

      const preProcessSample = samplePreProcessor?.();

      const saveOperations: SaveArgs<MaterialSample>[] = [];
      for (let index = 0; index < sampleHooks.length; index++) {
        const { formRef, resource, saveHook } = sampleHooks[index];
        const formik = formRef.current;

        // These two errors shouldn't happen:
        if (!formik) {
          throw new Error(
            `Missing Formik ref for sample ${resource.materialSampleName}`
          );
        }

        // TODO get rid of these try/catches when we can save
        // the Col Event + material sample all at once.
        try {
          const saveOp = await saveHook.prepareSampleSaveOperation({
            submittedValues: formik.values,
            preProcessSample: async (original) => {
              try {
                return (await preProcessSample?.(original)) ?? original;
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

      const savedSamples = await save<MaterialSample>(saveOperations, {
        apiBaseUrl: "/collection-api"
      });

      await onSaved(savedSamples);
    } catch (error: unknown) {
      // When there is an error from the bulk save-all operation, put it into the correct form:
      if (error instanceof DoOperationsError) {
        for (const opError of error.individualErrors) {
          const formik =
            typeof opError.index === "number"
              ? sampleHooks[opError.index].formRef.current
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
        // Don't show the bulk edited fields' errors in the individual sample tabs
        // because the user can't fix them there:
        sampleHooks
          .map((it) => it.formRef?.current)
          .forEach((it) => it?.setErrors(omit(it.errors, badBulkEditedFields)));
      }
      setError(error);
      throw new Error(formatMessage("bulkSubmissionErrorInfo"));
    }
  }

  return { saveAll };
}
