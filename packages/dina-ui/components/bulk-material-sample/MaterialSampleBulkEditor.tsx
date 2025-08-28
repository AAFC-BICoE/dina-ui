import {
  bulkEditAllManagedAttributes,
  BulkEditTabContextI,
  ButtonBar,
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
    materialSampleForm: JSX.Element;
    formTemplateProps: Partial<MaterialSampleFormProps>;
    bulkEditCollectingEvtFormRef;
  } = initializeRefHookFormProps(
    samplesProp,
    visibleManagedAttributeKeys,
    selectedTab,
    sampleFormTemplate,
    materialSampleInitialValues,
    collectingEventInitialValues
  );

  const [initialized, setInitialized] = useState(false);
  const { bulkEditTab, clearedFields, deletedFields } = useBulkEditTab({
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
      clearedFields,
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
    bulkEditCtx: { resourceHooks: sampleHooks, bulkEditFormRef, clearedFields },
    bulkEditCollectingEvtFormRef,
    bulkEditSampleHook
  });

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
  const bulkEditCollectingEvtFormRef =
    useRef<FormikProps<InputResource<CollectingEvent>>>(null);

  // don't use form template's materialSampleName default value for bulk edit
  delete materialSampleInitialValues?.materialSampleName;
  const bulkEditSampleHook = useMaterialSampleSave({
    ...formTemplateProps,
    materialSample: materialSampleInitialValues ?? initialValues,
    collectingEventInitialValues,
    showChangedIndicatorsInNestedForms: true,
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
  clearedFields?: Set<string>,
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

    // Material Sample Managed Attribute Handling:
    const materialSampleManagedAttributes = bulkEditAllManagedAttributes(
      baseSample.managedAttributes ?? {},
      bulkEditSample?.managedAttributes ?? {},
      clearedFields ?? new Set(),
      deletedFields ?? new Set(),
      "managedAttributes"
    );

    // Preparation Managed Attribute Handling
    const preparedManagedAttributes = bulkEditAllManagedAttributes(
      baseSample.preparationManagedAttributes ?? {},
      bulkEditSample?.preparationManagedAttributes ?? {},
      clearedFields ?? new Set(),
      deletedFields ?? new Set(),
      "preparationManagedAttributes"
    );

    const newHostOrganism = {
      ...withoutBlankFields(baseSample.hostOrganism),
      ...withoutBlankFields(bulkEditSample?.hostOrganism)
    };

    const newSample: InputResource<MaterialSample> = {
      ...baseSample,
      ...overrides,
      managedAttributes: materialSampleManagedAttributes,
      preparationManagedAttributes: preparedManagedAttributes,
      ...(!_.isEmpty(newHostOrganism) && {
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
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const {
    bulkEditFormRef,
    resourceHooks: sampleHooks,
    clearedFields
  } = bulkEditCtx;

  async function saveAll() {
    setSubmissionError(null);
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
                setSubmissionError(error);
                throw error;
              }
            },
            collectingEventRefExternal: bulkEditSampleHook.dataComponentState
              .enableCollectingEvent
              ? bulkEditCollectingEventRefPermanent
              : undefined
          });

          // Check if cleared fields have been requested, make the changes for each operation.
          if (clearedFields?.size) {
            for (const fieldName of clearedFields) {
              _.set(saveOp.resource as any, fieldName, "");
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
          setSubmissionError(error);
          throw error;
        }
      }

      // Filter out empty resources but keep track of their positions
      const nonEmptyOperations: SaveArgs<MaterialSample>[] = [];
      const nonEmptyIndices: number[] = [];
      const resultSamples: PersistedResource<MaterialSample>[] = new Array(
        saveOperations.length
      );

      // First pass: store empty resources and collect non-empty ones
      for (let i = 0; i < saveOperations.length; i++) {
        const operation = saveOperations[i];

        if (isResourceEmpty(operation.resource)) {
          // For empty resources, just store the original resource
          resultSamples[i] = operation.resource as any;
        } else {
          // For non-empty resources, collect for batch save
          nonEmptyOperations.push(operation);
          nonEmptyIndices.push(i);
        }
      }

      // Make a single API call for all non-empty resources
      if (nonEmptyOperations.length > 0) {
        const savedSamples = await save<MaterialSample>(nonEmptyOperations, {
          apiBaseUrl: "/collection-api"
        });

        // Place the saved resources in their original positions
        for (let i = 0; i < savedSamples.length; i++) {
          const originalIndex = nonEmptyIndices[i];
          resultSamples[originalIndex] = savedSamples[i];
        }
      }

      // Call onSaved with all samples in the original order
      await onSaved(resultSamples);
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
        // Don't show the bulk edited fields' errors in the individual sample tabs
        // because the user can't fix them there:
        sampleHooks
          .map((it) => it.formRef?.current)
          .forEach((it) =>
            it?.setErrors(_.omit(it.errors, badBulkEditedFields))
          );
      }
      setSubmissionError(error);
      throw new Error(formatMessage("bulkSubmissionErrorInfo"));
    }
  }

  return { saveAll, submissionError };
}
