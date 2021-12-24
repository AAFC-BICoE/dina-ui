import {
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  DoOperationsError,
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
  pickBy
} from "lodash";
import { useLayoutEffect, useRef, useState, ComponentProps } from "react";
import {
  BLANK_PREPARATION,
  CollectingEventFormLayout,
  ORGANISM_FIELDS,
  PREPARATION_FIELDS,
  useCollectingEventQuery,
  useCollectingEventSave,
  useDuplicateSampleNameDetection,
  useLastUsedCollection
} from "..";
import {
  AcquisitionEvent,
  CollectingEvent,
  MaterialSample
} from "../../../../dina-ui/types/collection-api";
import { Person } from "../../../../dina-ui/types/objectstore-api";
import {
  AcquisitionEventFormLayout,
  useAcquisitionEvent
} from "../../../pages/collection/acquisition-event/edit";
import { AllowAttachmentsConfig } from "../../object-store";

export function useMaterialSampleQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include: [
        "collection",
        "collectingEvent",
        "acquisitionEvent",
        "attachment",
        "preparationAttachment",
        "preparationType",
        "materialSampleType",
        "preparedBy",
        "storageUnit",
        "hierarchy",
        "organism",
        "materialSampleChildren",
        "parentMaterialSample",
        "projects"
      ].join(",")
    },
    {
      disabled: !id,
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "preparedBy",
          joinField: "preparedBy",
          path: (ms: MaterialSample) => `person/${ms.preparedBy?.id}`
        }
      ],
      onSuccess: async ({ data }) => {
        if (data.determination) {
          // Retrieve determiner arrays on determination.
          for (const determination of data.determination) {
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
        if (data.materialSampleChildren) {
          data.materialSampleChildren = compact(
            await bulkGet<MaterialSample, true>(
              data.materialSampleChildren.map(
                child =>
                  `/material-sample/${child.id}?include=materialSampleType`
              ),
              {
                apiBaseUrl: "/collection-api",
                returnNullForMissingResource: true
              }
            )
          );
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
  /** Initial values for creating a new Collecting Event with the Material Sample. */
  acquisitionEventInitialValues?: InputResource<AcquisitionEvent>;

  onSaved?: (id: string) => Promise<void>;

  colEventFormRef?: React.RefObject<FormikProps<any>>;
  acquisitionEventFormRef?: React.RefObject<FormikProps<any>>;

  isTemplate?: boolean;

  acqEventTemplateInitialValues?: Partial<AcquisitionEvent> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };
  colEventTemplateInitialValues?: Partial<CollectingEvent> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };
  materialSampleTemplateInitialValues?: Partial<MaterialSample> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };

  /** Optionally restrict the form to these enabled fields. */
  enabledFields?: {
    materialSample?: string[];
    collectingEvent?: string[];
    acquisitionEvent?: string[];
  };

  collectingEventAttachmentsConfig?: AllowAttachmentsConfig;

  /** Reduces the rendering to improve performance when bulk editing many material samples. */
  reduceRendering?: boolean;
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
  acquisitionEventInitialValues,
  onSaved,
  colEventFormRef: colEventFormRefProp,
  acquisitionEventFormRef: acquisitionEventFormRefProp,
  isTemplate,
  enabledFields,
  collectingEventAttachmentsConfig,
  acqEventTemplateInitialValues,
  colEventTemplateInitialValues,
  materialSampleTemplateInitialValues,
  reduceRendering
}: UseMaterialSampleSaveParams) {
  const { save } = useApiClient();

  // For editing existing templates:
  const hasColEventTemplate =
    isTemplate &&
    (!isEmpty(colEventTemplateInitialValues?.templateCheckboxes) ||
      colEventTemplateInitialValues?.id);

  const hasAcquisitionEventTemplate =
    isTemplate &&
    (!isEmpty(acqEventTemplateInitialValues?.templateCheckboxes) ||
      acqEventTemplateInitialValues?.id);

  const hasPreparationsTemplate =
    isTemplate &&
    !isEmpty(
      pick(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        ...PREPARATION_FIELDS
      )
    );

  const hasOrganismTemplate =
    isTemplate &&
    !isEmpty(
      pick(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        ORGANISM_FIELDS.map(
          organismFieldName => `organism.${organismFieldName}`
        )
      )
    );

  const hasStorageTemplate =
    isTemplate &&
    materialSampleTemplateInitialValues?.templateCheckboxes?.storageUnit;

  // For editing existing templates:
  const hasDeterminationTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith("determination[0].")
      )
    );

  const hasScheduledActionsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith("scheduledAction.")
      )
    );

  const hasAssociationsTemplate =
    isTemplate &&
    !isEmpty(
      pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) =>
          key.startsWith("associations[0].") || key.startsWith("hostOrganism.")
      )
    );

  const [enableCollectingEvent, setEnableCollectingEvent] = useState(
    Boolean(
      hasColEventTemplate ||
        materialSample?.collectingEvent ||
        enabledFields?.collectingEvent?.length
    )
  );

  const [enableAcquisitionEvent, setEnableAcquisitionEvent] = useState(
    Boolean(
      hasAcquisitionEventTemplate ||
        materialSample?.acquisitionEvent ||
        enabledFields?.acquisitionEvent?.length
    )
  );

  const [enablePreparations, setEnablePreparations] = useState(
    Boolean(
      hasPreparationsTemplate ||
        // Show the preparation section if a field is set or the field is enabled:
        PREPARATION_FIELDS.some(
          prepFieldName =>
            !isEmpty(materialSample?.[prepFieldName]) ||
            enabledFields?.materialSample?.includes(prepFieldName)
        )
    )
  );

  const [enableOrganism, setEnableOrganism] = useState(
    Boolean(
      hasOrganismTemplate ||
        // Show the organism section if a field is set or the field is enabled:
        ORGANISM_FIELDS.some(
          organismFieldName =>
            materialSample?.organism?.[`${organismFieldName}`] ||
            enabledFields?.materialSample?.includes(
              `organism.${organismFieldName}`
            )
        )
    )
  );

  const [enableStorage, setEnableStorage] = useState(
    // Show the Storage section if the storage field is set or the template enables it:
    Boolean(
      hasStorageTemplate ||
        materialSample?.storageUnit?.id ||
        enabledFields?.materialSample?.includes("storageUnit")
    )
  );

  const [enableDetermination, setEnableDetermination] = useState(
    Boolean(
      hasDeterminationTemplate ||
        // Show the determination section if a field is set or the field is enabled:
        // Ignore the "isPrimary": field:
        materialSample?.determination?.some(
          ({ isPrimary, ...det }) => !isEmpty(det)
        ) ||
        enabledFields?.materialSample?.some(enabledField =>
          enabledField.startsWith("determination[")
        )
    )
  );

  const [enableScheduledActions, setEnableScheduledActions] = useState(
    // Show the Scheduled Actions section if the field is set or the template enables it:
    Boolean(
      hasScheduledActionsTemplate ||
        materialSample?.scheduledActions?.length ||
        enabledFields?.materialSample?.some(enabledField =>
          enabledField.startsWith("scheduledAction.")
        )
    )
  );

  const [enableAssociations, setEnableAssociations] = useState(
    // Show the associations section if the field is set or the template enables it:
    Boolean(
      hasAssociationsTemplate ||
        materialSample?.associations?.length ||
        !isEmpty(materialSample?.hostOrganism) ||
        !isEmpty(materialSample?.associations) ||
        enabledFields?.materialSample?.some(
          enabledField =>
            enabledField.startsWith("associations[0].") ||
            enabledField.startsWith("hostOrganism.")
        )
    )
  );

  // The state describing which Data components (Form sections) are enabled:
  const dataComponentState = {
    enableCollectingEvent,
    setEnableCollectingEvent,
    enableAcquisitionEvent,
    setEnableAcquisitionEvent,
    enablePreparations,
    setEnablePreparations,
    enableOrganism,
    setEnableOrganism,
    enableStorage,
    setEnableStorage,
    enableDetermination,
    setEnableDetermination,
    enableScheduledActions,
    setEnableScheduledActions,
    enableAssociations,
    setEnableAssociations
  };

  const { loading, lastUsedCollection } = useLastUsedCollection();

  const msInitialValues: InputResource<MaterialSample> = {
    ...(materialSample || {
      type: "material-sample",
      managedAttributes: {},
      // Defaults to the last Collection used to create a Material Sample:
      collection: lastUsedCollection,
      publiclyReleasable: true
    })
  };

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

  const acqEventFormRef =
    acquisitionEventFormRefProp ?? useRef<FormikProps<any>>(null);
  const [acqEventId, setAcqEventId] = useState<string | null | undefined>(
    isTemplate
      ? acqEventTemplateInitialValues?.id
      : materialSample?.acquisitionEvent?.id
  );
  const acqEventQuery = useAcquisitionEvent(acqEventId);

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

  async function prepareSampleInput(
    submittedValues: InputResource<MaterialSample>
  ): Promise<InputResource<MaterialSample>> {
    /** Input to submit to the back-end API. */
    const materialSampleInput: InputResource<MaterialSample> = {
      ...submittedValues,

      // Remove the values from sections that were toggled off:
      ...(!enablePreparations && BLANK_PREPARATION),
      ...(!enableOrganism && { organism: null }),
      ...(!enableStorage && {
        storageUnit: { id: null, type: "storage-unit" }
      }),
      ...(!enableCollectingEvent && {
        collectingEvent: { id: null, type: "collecting-event" }
      }),
      ...(!enableAcquisitionEvent && {
        acquisitionEvent: { id: null, type: "acquisition-event" }
      }),
      ...(!enableAssociations && { associations: [], hostOrganism: null }),

      determination: enableDetermination
        ? submittedValues.determination?.map(det => ({
            ...det,
            ...(!!det.determiner && {
              determiner: det.determiner.map(determiner =>
                typeof determiner === "string"
                  ? determiner
                  : String(determiner.id)
              )
            })
          }))
        : []
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

    // Save and link the Acquisition Event if enabled:
    if (enableAcquisitionEvent && acqEventFormRef.current) {
      // Save the linked AcqEvent if included:
      const submittedAcqEvent: PersistedResource<AcquisitionEvent> = cloneDeep(
        acqEventFormRef.current.values
      );

      const acqEventWasEdited =
        !submittedAcqEvent?.id ||
        !isEqual(submittedAcqEvent, acqEventFormRef.current.initialValues);

      try {
        // Throw if the Acq Event sub-form has errors:
        const acqEventErrors = await acqEventFormRef.current.validateForm();
        if (!isEmpty(acqEventErrors)) {
          throw new DoOperationsError("", acqEventErrors);
        }

        // Only send the save request if the Acq Event was edited:
        const [savedAcqEvent] = acqEventWasEdited
          ? // Use the same save method as the Acq Event page:
            await save<AcquisitionEvent>(
              [
                {
                  resource: submittedAcqEvent,
                  type: "acquisition-event"
                }
              ],
              { apiBaseUrl: "/collection-api" }
            )
          : [submittedAcqEvent];

        // Set the acqEventId here in case the next operation fails:
        setAcqEventId(savedAcqEvent.id);

        // Link the MaterialSample to the AcquisitionEvent:
        materialSampleInput.acquisitionEvent = {
          id: savedAcqEvent.id,
          type: savedAcqEvent.type
        };
      } catch (error: unknown) {
        if (error instanceof DoOperationsError) {
          // Put the error messages into both form states:
          acqEventFormRef.current.setStatus(error.message);
          acqEventFormRef.current.setErrors(error.fieldErrors);
          throw new DoOperationsError(
            error.message,
            mapKeys(
              error.fieldErrors,
              (_, field) => `acquisitionEvent.${field}`
            )
          );
        }
        throw error;
      }
    }

    return materialSampleInput;
  }

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

    /** Input to submit to the back-end API. */
    const msInputWithRelationships: InputResource<MaterialSample> & {
      relationships: any;
    } = {
      ...msDiff,

      // Kitsu serialization can't tell the difference between an array attribute and an array relationship.
      // Explicitly declare these fields as relationships here before saving:
      // One-to-many relationships go in the 'relationships' object:
      relationships: {
        ...(msDiff.attachment && {
          attachment: {
            data: msDiff.attachment.map(({ id, type }) => ({ id, type }))
          }
        }),
        ...(msDiff.preparationAttachment && {
          preparationAttachment: {
            data: msDiff.preparationAttachment.map(({ id, type }) => ({
              id,
              type
            }))
          }
        }),
        ...(msDiff.projects && {
          projects: {
            data: msDiff.projects.map(({ id, type }) => ({ id, type }))
          }
        })
      },
      // Set the attributes to undefined after they've been moved to "relationships":
      attachment: undefined,
      preparationAttachment: undefined,
      projects: undefined
    };

    const saveOperation = {
      resource: msInputWithRelationships,
      type: "material-sample"
    };

    return saveOperation;
  }

  async function onSubmit({
    submittedValues,
    formik
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    // In case of error, return early instead of saving to the back-end:
    const materialSampleSaveOp = await prepareSampleSaveOperation({
      submittedValues
    });

    // Save the MaterialSample:
    const [savedMaterialSample] = await withDuplicateSampleNameCheck(
      async () =>
        await save<MaterialSample>([materialSampleSaveOp], {
          apiBaseUrl: "/collection-api"
        }),
      formik
    );

    await onSaved?.(savedMaterialSample.id);
  }

  /** Re-use the CollectingEvent form layout from the Collecting Event edit page. */
  function nestedCollectingEventForm(
    initialValues?: PersistedResource<CollectingEvent>
  ) {
    const colEventFormProps: DinaFormProps<any> = {
      innerRef: colEventFormRef,
      initialValues:
        initialValues ??
        (isTemplate
          ? colEventTemplateInitialValues
          : collectingEventInitialValues),
      validationSchema: collectingEventFormSchema,
      isTemplate,
      readOnly: isTemplate ? !!colEventId : false,
      enabledFields: enabledFields?.collectingEvent,
      children: reduceRendering ? (
        <div />
      ) : (
        <CollectingEventFormLayout
          attachmentsConfig={collectingEventAttachmentsConfig}
        />
      )
    };

    return <DinaForm {...colEventFormProps} />;
  }

  function nestedAcqEventForm(
    initialValues?: PersistedResource<AcquisitionEvent>
  ) {
    const acqEventFormProps: DinaFormProps<any> = {
      innerRef: acqEventFormRef,
      initialValues:
        initialValues ??
        (isTemplate
          ? acqEventTemplateInitialValues
          : { type: "acquisition-event", ...acquisitionEventInitialValues }),
      isTemplate,
      readOnly: isTemplate ? !!acqEventId : false,
      enabledFields: enabledFields?.acquisitionEvent,
      children: reduceRendering ? <div /> : <AcquisitionEventFormLayout />
    };

    return acqEventId ? (
      withResponse(acqEventQuery, ({ data }) => (
        <DinaForm {...acqEventFormProps} initialValues={data} />
      ))
    ) : (
      <DinaForm {...acqEventFormProps} />
    );
  }

  return {
    initialValues: msInitialValues,
    nestedCollectingEventForm,
    nestedAcqEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    acqEventId,
    setAcqEventId,
    onSubmit,
    prepareSampleInput,
    prepareSampleSaveOperation,
    loading
  };
}
