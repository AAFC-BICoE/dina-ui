import {
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  DoOperationsError,
  OperationError,
  processExtensionValuesLoading,
  processExtensionValuesSaving,
  resourceDifference,
  SaveArgs,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import {
  cloneDeep,
  compact,
  isEmpty,
  isEqual,
  mapKeys,
  pick,
  pickBy,
  range,
  find
} from "lodash";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import {
  BLANK_PREPARATION,
  CollectingEventFormLayout,
  PREPARATION_FIELDS,
  useCollectingEventQuery,
  useCollectingEventSave,
  useDuplicateSampleNameDetection,
  useLastUsedCollection
} from "../..";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  CollectingEvent,
  COLLECTING_EVENT_COMPONENT_NAME,
  Collection,
  FormTemplate,
  MaterialSample,
  Organism,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  RESTRICTION_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME
} from "../../../../dina-ui/types/collection-api";
import { Person } from "../../../../dina-ui/types/objectstore-api";
import { AllowAttachmentsConfig } from "../../object-store";
import { VisibleManagedAttributesConfig } from "./MaterialSampleForm";
import { BLANK_RESTRICTION, RESTRICTIONS_FIELDS } from "./RestrictionField";
import { useGenerateSequence } from "./useGenerateSequence";

export function useMaterialSampleQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include: [
        "collection",
        "collectingEvent",
        "attachment",
        "preparationProtocol",
        "preparationType",
        "preparationMethod",
        "preparedBy",
        "storageUnit",
        "hierarchy",
        "organism",
        "materialSampleChildren",
        "parentMaterialSample",
        "projects",
        "assemblages"
      ].join(",")
    },
    {
      disabled: !id,
      onSuccess: async ({ data }) => {
        for (const organism of data.organism ?? []) {
          if (organism?.determination) {
            // Retrieve determiner arrays on determination.
            for (const determination of organism.determination) {
              if (determination.determiner) {
                determination.determiner = compact(
                  await bulkGet<Person, true>(
                    determination.determiner.map(
                      (personId: string) => `/person/${personId}`
                    ),
                    {
                      apiBaseUrl: "/agent-api",
                      returnNullForMissingResource: true
                    }
                  )
                );
              }
            }
          }
        }

        // Process loaded back-end data into data structure that Forkmiks can use
        if (data.extensionValues) {
          data.extensionValuesForm = processExtensionValuesLoading(
            data.extensionValues
          );
          delete data.extensionValues;
        }

        // Convert to separated list
        if (data.restrictionFieldsExtension) {
          // Process risk groups
          if (data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[0]]) {
            data[RESTRICTIONS_FIELDS[0]] = {
              extKey: RESTRICTIONS_FIELDS[0],
              value:
                data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[0]]
                  .risk_group
            };
          }
          if (data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[1]]) {
            data[RESTRICTIONS_FIELDS[1]] = {
              extKey: RESTRICTIONS_FIELDS[1],
              value:
                data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[1]]
                  .risk_group
            };
          }

          // Process levels
          if (data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[2]]) {
            data[RESTRICTIONS_FIELDS[2]] = {
              extKey: RESTRICTIONS_FIELDS[2],
              value:
                data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[2]].level
            };
          }
          if (data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[3]]) {
            data[RESTRICTIONS_FIELDS[3]] = {
              extKey: RESTRICTIONS_FIELDS[3],
              value:
                data.restrictionFieldsExtension[RESTRICTIONS_FIELDS[3]].level
            };
          }
        }
      }
    }
  );

  return materialSampleQuery;
}
export interface UseMaterialSampleSaveParams {
  /** Material Sample form initial values. */
  materialSample?: InputResource<MaterialSample>;
  /** Initial values for creating a new Collecting Event with the Material Sample. */
  collectingEventInitialValues?: InputResource<CollectingEvent>;

  onSaved?: (id: string) => Promise<void>;

  colEventFormRef?: React.RefObject<FormikProps<any>>;

  isTemplate?: boolean;

  colEventTemplateInitialValues?: Partial<CollectingEvent> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };
  materialSampleTemplateInitialValues?: Partial<MaterialSample> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };

  /** Split Configuration (Form Template Only) */
  splitConfigurationInitialState?: boolean;

  /** Optionally restrict the form to these enabled fields. */
  formTemplate?: FormTemplate;

  collectingEventAttachmentsConfig?: AllowAttachmentsConfig;

  /** Reduces the rendering to improve performance when bulk editing many material samples. */
  reduceRendering?: boolean;

  /** Disable the nested Collecting Event forms. */
  disableNestedFormEdits?: boolean;

  showChangedIndicatorsInNestedForms?: boolean;

  visibleManagedAttributeKeys?: VisibleManagedAttributesConfig;
}

export interface PrepareSampleSaveOperationParams {
  submittedValues: any;
  preProcessSample?: (
    sample: InputResource<MaterialSample>
  ) => Promise<InputResource<MaterialSample>>;
}

export function useMaterialSampleSave({
  materialSample,
  collectingEventInitialValues: collectingEventInitialValuesProp,
  onSaved,
  colEventFormRef: colEventFormRefProp,
  isTemplate,
  formTemplate,
  collectingEventAttachmentsConfig,
  colEventTemplateInitialValues,
  materialSampleTemplateInitialValues,
  splitConfigurationInitialState,
  reduceRendering,
  disableNestedFormEdits,
  showChangedIndicatorsInNestedForms,
  visibleManagedAttributeKeys
}: UseMaterialSampleSaveParams) {
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  // For editing existing templates:
  const hasColEventTemplate =
    isTemplate &&
    (!isEmpty(colEventTemplateInitialValues?.templateCheckboxes) ||
      colEventTemplateInitialValues?.id);

  const hasPreparationsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(PREPARATIONS_COMPONENT_NAME)
      )
    );

  const hasOrganismsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(ORGANISMS_COMPONENT_NAME)
      )
    );

  const hasStorageTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(STORAGE_COMPONENT_NAME)
      )
    );

  const hasScheduledActionsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(SCHEDULED_ACTIONS_COMPONENT_NAME)
      )
    );

  const hasAssociationsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(ASSOCIATIONS_COMPONENT_NAME)
      )
    );

  const hasRestrictionsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(RESTRICTION_COMPONENT_NAME)
      )
    );

  // Enable Switch States:
  const [enableSplitConfiguration, setEnableSplitConfiguration] =
    useState<boolean>(false);
  const [enableCollectingEvent, setEnableCollectingEvent] =
    useState<boolean>(false);
  const [enablePreparations, setEnablePreparations] = useState<boolean>(false);
  const [enableOrganisms, setEnableOrganisms] = useState<boolean>(false);
  const [enableStorage, setEnableStorage] = useState<boolean>(false);
  const [enableScheduledActions, setEnableScheduledActions] =
    useState<boolean>(false);
  const [enableAssociations, setEnableAssociations] = useState<boolean>(false);
  const [enableRestrictions, setEnableRestrictions] = useState<boolean>(false);

  // Setup the enabled fields state based on the form template being used.
  useEffect(() => {
    setEnableSplitConfiguration(splitConfigurationInitialState ?? false);

    setEnableCollectingEvent(
      Boolean(
        hasColEventTemplate ||
          materialSample?.collectingEvent ||
          (find(formTemplate?.components, {
            name: COLLECTING_EVENT_COMPONENT_NAME
          })?.visible ??
            false)
      )
    );

    setEnablePreparations(
      Boolean(
        hasPreparationsTemplate ||
          // Show the preparation section if a field is set or the field is enabled:
          PREPARATION_FIELDS.some(
            (prepFieldName) =>
              !isEmpty(materialSample?.[prepFieldName]) ||
              (find(formTemplate?.components, {
                name: PREPARATIONS_COMPONENT_NAME
              })?.visible ??
                false)
          )
      )
    );

    setEnableOrganisms(
      Boolean(
        hasOrganismsTemplate ||
          materialSample?.organism?.length ||
          (find(formTemplate?.components, {
            name: ORGANISMS_COMPONENT_NAME
          })?.visible ??
            false)
      )
    );

    setEnableStorage(
      // Show the Storage section if the storage field is set or the template enables it:
      Boolean(
        hasStorageTemplate ||
          materialSample?.storageUnit?.id ||
          (find(formTemplate?.components, {
            name: STORAGE_COMPONENT_NAME
          })?.visible ??
            false)
      )
    );

    setEnableScheduledActions(
      // Show the Scheduled Actions section if the field is set or the template enables it:
      Boolean(
        hasScheduledActionsTemplate ||
          materialSample?.scheduledActions?.length ||
          (find(formTemplate?.components, {
            name: SCHEDULED_ACTIONS_COMPONENT_NAME
          })?.visible ??
            false)
      )
    );

    setEnableAssociations(
      // Show the associations section if the field is set or the template enables it:
      Boolean(
        hasAssociationsTemplate ||
          materialSample?.associations?.length ||
          !isEmpty(materialSample?.hostOrganism) ||
          !isEmpty(materialSample?.associations) ||
          (find(formTemplate?.components, {
            name: ASSOCIATIONS_COMPONENT_NAME
          })?.visible ??
            false)
      )
    );

    setEnableRestrictions(
      Boolean(
        hasRestrictionsTemplate ||
          // Show the restriction section if a field is set or the field is enabled:
          RESTRICTIONS_FIELDS.some(
            (restrictFieldName) =>
              !isEmpty(materialSample?.[restrictFieldName]) ||
              (find(formTemplate?.components, {
                name: RESTRICTION_COMPONENT_NAME
              })?.visible ??
                false)
          )
      )
    );
  }, [formTemplate]);

  // The state describing which Data components (Form sections) are enabled:
  const dataComponentState = {
    enableCollectingEvent,
    setEnableCollectingEvent,
    enablePreparations,
    setEnablePreparations,
    enableOrganisms,
    setEnableOrganisms,
    enableStorage,
    setEnableStorage,
    enableScheduledActions,
    setEnableScheduledActions,
    enableAssociations,
    setEnableAssociations,
    enableRestrictions,
    setEnableRestrictions,
    enableSplitConfiguration,
    setEnableSplitConfiguration
  };

  const { loading, lastUsedCollection } = useLastUsedCollection();

  const defaultValues: InputResource<MaterialSample> = {
    type: "material-sample",
    managedAttributes: {},
    // Defaults to the last Collection used to create a Material Sample:
    collection: lastUsedCollection,
    publiclyReleasable: true
  };

  const msInitialValues: InputResource<MaterialSample> =
    withOrganismEditorValues(materialSample ?? defaultValues);

  /** Used to get the values of the nested CollectingEvent form. */
  const colEventFormRef = colEventFormRefProp ?? useRef<FormikProps<any>>(null);
  const [colEventId, setColEventId] = useState<string | null | undefined>(
    isTemplate
      ? colEventTemplateInitialValues?.id
      : materialSample?.collectingEvent?.id
  );
  const colEventQuery = useCollectingEventQuery(colEventId);
  const {
    collectingEventInitialValues: collectingEventHookInitialValues,
    saveCollectingEvent,
    collectingEventFormSchema
  } = useCollectingEventSave({
    attachmentsConfig: collectingEventAttachmentsConfig,
    fetchedCollectingEvent: colEventQuery.response?.data
  });
  const collectingEventInitialValues =
    collectingEventInitialValuesProp ?? collectingEventHookInitialValues;

  // Add zebra-striping effect to the form sections. Every second top-level fieldset should have a grey background.
  useLayoutEffect(() => {
    const dataComponents = document?.querySelectorAll<HTMLDivElement>(
      ".data-components fieldset:not(.d-none, .non-strip)"
    );
    dataComponents?.forEach((element, index) => {
      element.style.backgroundColor = index % 2 === 1 ? "#f3f3f3" : "";
    });
  });

  const { withDuplicateSampleNameCheck } = useDuplicateSampleNameDetection();

  /** Gets the new state of the sample before submission to the back-end, given the form state. */
  async function prepareSampleInput(
    submittedValues: InputResource<MaterialSample>
  ): Promise<InputResource<MaterialSample>> {
    // Set the restrictionFieldsExtension
    submittedValues.restrictionFieldsExtension = {};
    if (submittedValues.phac_cl && submittedValues.phac_cl.extKey) {
      submittedValues.restrictionFieldsExtension[
        submittedValues.phac_cl.extKey
      ] = {
        level: submittedValues?.phac_cl?.value
      };
    }
    if (submittedValues.cfia_ppc && submittedValues.cfia_ppc.extKey) {
      submittedValues.restrictionFieldsExtension[
        submittedValues.cfia_ppc.extKey
      ] = {
        level: submittedValues?.cfia_ppc?.value
      };
    }
    if (
      submittedValues.phac_animal_rg &&
      submittedValues.phac_animal_rg.extKey
    ) {
      submittedValues.restrictionFieldsExtension[
        submittedValues.phac_animal_rg.extKey
      ] = {
        risk_group: submittedValues?.phac_animal_rg?.value
      };
    }
    if (submittedValues.phac_human_rg && submittedValues.phac_human_rg.extKey) {
      submittedValues.restrictionFieldsExtension[
        submittedValues.phac_human_rg.extKey
      ] = {
        risk_group: submittedValues?.phac_human_rg?.value
      };
    }

    if (submittedValues.extensionValuesForm) {
      submittedValues.extensionValues = processExtensionValuesSaving(
        submittedValues.extensionValuesForm
      );
    }
    delete submittedValues.extensionValuesForm;

    /** Input to submit to the back-end API. */
    const materialSampleInput: InputResource<MaterialSample> = {
      ...submittedValues,

      // Remove the values from sections that were toggled off:
      ...(!enablePreparations && BLANK_PREPARATION),
      ...(!enableRestrictions && BLANK_RESTRICTION),
      ...(!enableOrganisms && {
        organismsIndividualEntry: undefined,
        organismsQuantity: undefined,
        organism: []
      }),

      ...(!enableStorage && {
        storageUnit: { id: null, type: "storage-unit" }
      }),
      ...(!enableCollectingEvent && {
        collectingEvent: { id: null, type: "collecting-event" }
      }),
      ...(!enableAssociations && { associations: [], hostOrganism: null }),

      // Remove the scheduledAction field from the Form Template:
      ...{ scheduledAction: undefined }
    };

    // Save and link the Collecting Event if enabled:
    if (enableCollectingEvent && colEventFormRef.current) {
      // Save the linked CollectingEvent if included:
      const submittedCollectingEvent = cloneDeep(
        colEventFormRef.current.values
      );

      const collectingEventWasEdited =
        !submittedCollectingEvent.id ||
        !isEqual(submittedCollectingEvent, collectingEventInitialValues);

      try {
        // Throw if the Collecting Event sub-form has errors:
        const colEventErrors = await colEventFormRef.current.validateForm();
        if (!isEmpty(colEventErrors)) {
          throw new DoOperationsError("", colEventErrors);
        }

        // Only send the save request if the Collecting Event was edited:
        const savedCollectingEvent = collectingEventWasEdited
          ? // Use the same save method as the Collecting Event page:
            await saveCollectingEvent(
              submittedCollectingEvent,
              colEventFormRef.current
            )
          : submittedCollectingEvent;

        // Set the ColEventId here in case the next operation fails:
        setColEventId(savedCollectingEvent.id);

        // Link the MaterialSample to the CollectingEvent:
        materialSampleInput.collectingEvent = {
          id: savedCollectingEvent.id,
          type: savedCollectingEvent.type
        };
      } catch (error: unknown) {
        if (error instanceof DoOperationsError) {
          // Put the error messages into both form states:
          colEventFormRef.current.setStatus(error.message);
          colEventFormRef.current.setErrors(error.fieldErrors);
          throw new DoOperationsError(
            error.message,
            mapKeys(error.fieldErrors, (_, field) => `collectingEvent.${field}`)
          );
        }
        throw error;
      }
    }

    // Throw error if useTargetOrganism is enabled without a target organism selected
    if (
      materialSampleInput.useTargetOrganism &&
      !materialSampleInput.organism?.some((organism) => organism?.isTarget)
    ) {
      throw new DoOperationsError(
        formatMessage("field_useTargetOrganismError")
      );
    }

    delete materialSampleInput.phac_animal_rg;
    delete materialSampleInput.phac_cl;
    delete materialSampleInput.phac_human_rg;
    delete materialSampleInput.cfia_ppc;
    delete materialSampleInput.useTargetOrganism;

    return materialSampleInput;
  }

  /**
   * Gets the diff of the form's initial values to the new sample state,
   * so only edited values are submitted to the back-end.
   */
  async function prepareSampleSaveOperation({
    submittedValues,
    preProcessSample
  }: PrepareSampleSaveOperationParams): Promise<SaveArgs<MaterialSample>> {
    const materialSampleInput = await prepareSampleInput(submittedValues);

    const msPreprocessed =
      (await preProcessSample?.(materialSampleInput)) ?? materialSampleInput;

    // Only submit the changed values to the back-end:
    const msDiff = msInitialValues.id
      ? resourceDifference({
          original: msInitialValues,
          updated: msPreprocessed
        })
      : msPreprocessed;

    const organismsWereChanged =
      !!msDiff.organism ||
      msDiff.organismsQuantity !== undefined ||
      msDiff.organismsIndividualEntry !== undefined;

    const msDiffWithOrganisms = organismsWereChanged
      ? { ...msDiff, organism: await saveAndAttachOrganisms(msPreprocessed) }
      : msDiff;

    /** Input to submit to the back-end API. */
    const msInputWithRelationships: InputResource<MaterialSample> & {
      relationships: any;
    } = {
      ...msDiffWithOrganisms,

      // These values are not submitted to the back-end:
      organismsIndividualEntry: undefined,
      organismsQuantity: undefined,

      // Kitsu serialization can't tell the difference between an array attribute and an array relationship.
      // Explicitly declare these fields as relationships here before saving:
      // One-to-many relationships go in the 'relationships' object:
      relationships: {
        ...(msDiffWithOrganisms.attachment && {
          attachment: {
            data: msDiffWithOrganisms.attachment.map((it) =>
              pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.projects && {
          projects: {
            data: msDiffWithOrganisms.projects.map((it) =>
              pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.assemblages && {
          assemblages: {
            data: msDiffWithOrganisms.assemblages.map((it) =>
              pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.organism && {
          organism: {
            data: msDiffWithOrganisms.organism.map((it) =>
              pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.preparedBy && {
          preparedBy: {
            data: msDiffWithOrganisms.preparedBy.map((it) =>
              pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.preparationType?.id && {
          preparationType: {
            data: pick(msDiffWithOrganisms.preparationType, "id", "type")
          }
        }),
        ...(msDiffWithOrganisms.collection?.id && {
          collection: {
            data: pick(msDiffWithOrganisms.collection, "id", "type")
          }
        })
      },

      // Set the attributes to undefined after they've been moved to "relationships":
      attachment: undefined,
      projects: undefined,
      organism: undefined,
      assemblages: undefined,
      preparedBy: undefined
    };

    // delete the association if associated sample is left unfilled
    if (
      msInputWithRelationships.associations?.length === 1 &&
      !msInputWithRelationships.associations[0].associatedSample
    ) {
      msInputWithRelationships.associations = [];
    }
    const saveOperation = {
      resource: msInputWithRelationships,
      type: "material-sample"
    };

    return saveOperation;
  }

  /**
   * Saves and attaches them to the sample with the ID.
   * Does not modify the sample input, just returns a new sample input.
   */
  async function saveAndAttachOrganisms(
    sample: InputResource<MaterialSample>
  ): Promise<PersistedResource<Organism>[]> {
    const preparedOrganisms: Organism[] = range(
      0,
      sample.organismsQuantity ?? undefined
    )
      .map((index) => {
        const defaults = {
          // Default to the sample's group:
          group: sample.group,
          type: "organism" as const
        };

        const { id: firstOrganismId, ...firstOrganismValues } =
          sample.organism?.[0] ?? {};

        return {
          ...sample.organism?.[index],
          // When Individual Entry is disabled,
          // copy the first organism's values onto the rest of the organisms:
          ...(!sample.organismsIndividualEntry && firstOrganismValues),
          ...defaults
        };
      })
      // Convert determiners from Objects to UUID strings:
      .map((org) => ({
        ...org,
        determination: org.determination?.map((det) => ({
          ...det,
          determiner: det.determiner?.map((determiner) =>
            typeof determiner === "string" ? determiner : String(determiner.id)
          )
        }))
      }));

    const organismSaveArgs: SaveArgs<Organism>[] = preparedOrganisms.map(
      (resource) => ({
        resource,
        type: "organism"
      })
    );

    try {
      // Don't call the API with an empty Save array:
      if (!organismSaveArgs.length) {
        return [];
      }
      const savedOrganisms = await save<Organism>(organismSaveArgs, {
        apiBaseUrl: "/collection-api"
      });

      return savedOrganisms;
    } catch (error: unknown) {
      if (error instanceof DoOperationsError) {
        const newErrors = error.individualErrors.map<OperationError>((err) => ({
          fieldErrors: mapKeys(
            err.fieldErrors,
            (_, field) => `organism[${err.index}].${field}`
          ),
          errorMessage: err.errorMessage,
          index: err.index
        }));

        const overallFieldErrors = newErrors.reduce(
          (total, curr) => ({ ...total, ...curr.fieldErrors }),
          {}
        );

        throw new DoOperationsError(error.message, overallFieldErrors);
      } else {
        throw error;
      }
    }
  }

  async function onSubmit({
    submittedValues,
    formik
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    // In case of error, return early instead of saving to the back-end:
    const materialSampleSaveOp = await prepareSampleSaveOperation({
      submittedValues
    });

    async function saveToBackend() {
      delete materialSampleSaveOp.resource.useNextSequence;
      const [savedMaterialSample] = await withDuplicateSampleNameCheck(
        async () =>
          await save<MaterialSample>([materialSampleSaveOp], {
            apiBaseUrl: "/collection-api"
          }),
        formik
      );
      await onSaved?.(savedMaterialSample?.id);
    }

    if (submittedValues.collection?.id && submittedValues.useNextSequence) {
      useGenerateSequence({
        collectionId: submittedValues.collection?.id as any,
        amount: 1,
        save
      }).then(async (data) => {
        if (data.result?.lowReservedID && data.result.highReservedID) {
          const prefix = materialSampleSaveOp.resource.collection
            ? (materialSampleSaveOp.resource.collection as Collection).code ??
              (materialSampleSaveOp.resource.collection as Collection).name
            : "";
          materialSampleSaveOp.resource.materialSampleName =
            (prefix as any) + data.result?.lowReservedID;
        }
        await saveToBackend();
      });
    } else {
      await saveToBackend();
    }
  }

  // In bulk edit mode, show green labels and green inputs for changed fields in
  // the nested Collection Event forms.
  const nestedFormClassName = showChangedIndicatorsInNestedForms
    ? "show-changed-indicators"
    : "";

  /** Re-use the CollectingEvent form layout from the Collecting Event edit page. */
  function nestedCollectingEventForm(
    colEvent?: PersistedResource<CollectingEvent>
  ) {
    const initialValues =
      colEvent ??
      (isTemplate
        ? colEventTemplateInitialValues
        : collectingEventInitialValues);

    const colEventFormProps: DinaFormProps<any> = {
      innerRef: colEventFormRef,
      initialValues,
      validationSchema: collectingEventFormSchema,
      isTemplate,
      // In bulk-edit and workflow run, disable editing existing Col events:
      readOnly: disableNestedFormEdits || isTemplate ? !!colEventId : false,
      formTemplate,
      children: reduceRendering ? (
        <div />
      ) : (
        <div className={nestedFormClassName}>
          <CollectingEventFormLayout
            visibleManagedAttributeKeys={
              visibleManagedAttributeKeys?.collectingEvent
            }
            attachmentsConfig={collectingEventAttachmentsConfig}
          />
        </div>
      )
    };

    return <DinaForm {...colEventFormProps} />;
  }

  return {
    initialValues: msInitialValues,
    nestedCollectingEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    onSubmit,
    prepareSampleInput,
    prepareSampleSaveOperation,
    loading
  };
}

/** Returns the material sample with the added client-side-only form fields. */
export function withOrganismEditorValues<
  T extends InputResource<MaterialSample> | PersistedResource<MaterialSample>
>(materialSample: T): T {
  // If there are different organisms then initially show the individual organisms edit UI:
  const hasDifferentOrganisms = materialSample?.organism?.some((org) => {
    const firstOrg = materialSample?.organism?.[0];

    const {
      id: _firstOrgId,
      createdOn: _firstOrgCreatedOn,
      ...firstOrgValues
    } = firstOrg ?? {};
    const {
      id: _id,
      createdOn: _thisOrgCreatedOn,
      ...thisOrgValues
    } = org ?? {};

    return !isEqual(firstOrgValues, thisOrgValues);
  });

  return {
    ...materialSample,
    // Client-side-only organisms UI fields:
    organismsQuantity: materialSample?.organism?.length,
    organismsIndividualEntry: hasDifferentOrganisms
  };
}
