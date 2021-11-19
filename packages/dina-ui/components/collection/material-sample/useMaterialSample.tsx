import {
  AreYouSureModal,
  DinaForm,
  DinaFormSubmitParams,
  useApiClient,
  useModal,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import {
  cloneDeep,
  compact,
  fromPairs,
  isEmpty,
  isEqual,
  pick,
  pickBy,
  toPairs
} from "lodash";
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import {
  BLANK_PREPARATION,
  CollectingEventFormLayout,
  DETERMINATION_FIELDS,
  ORGANISM_FIELDS,
  PREPARATION_FIELDS,
  SCHEDULEDACTION_FIELDS,
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
import {
  ManagedAttributeValues,
  Person
} from "../../../../dina-ui/types/objectstore-api";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEventFormLayout,
  useAcquisitionEvent
} from "../../../pages/collection/acquisition-event/edit";
import { AllowAttachmentsConfig } from "../../object-store";
import { HOSTORGANISM_FIELDS } from "../AssociationsField";
import { MATERIALSAMPLE_ASSOCIATION_FIELDS } from "../MaterialSampleAssociationsField";

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
        "parentMaterialSample"
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
        if (data.managedAttributes) {
          const managedAttributeValues: ManagedAttributeValues = {};
          toPairs(data?.managedAttributes as any).map(
            attr =>
              (managedAttributeValues[attr[0]] = {
                assignedValue: attr[1] as any
              })
          );
          delete data?.managedAttributes;
          data.managedAttributeValues = managedAttributeValues;
        }
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
  materialSampleTemplateInitialValues
}: UseMaterialSampleSaveParams) {
  const { openModal } = useModal();

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
    setEnableAssociations,
    /** Wraps the useState setter with an AreYouSure modal when setting to false. */
    dataComponentToggler(
      setBoolean: Dispatch<SetStateAction<boolean>>,
      componentName: string
    ) {
      return function toggleDataComponent(enabled: boolean) {
        if (!enabled) {
          // When removing data, ask the user for confirmation first:
          openModal(
            <AreYouSureModal
              actionMessage={
                <DinaMessage
                  id="removeComponentData"
                  values={{ component: componentName }}
                />
              }
              onYesButtonClicked={() => setBoolean(enabled)}
            />
          );
        } else {
          setBoolean(enabled);
        }
      };
    }
  };

  const { loading, lastUsedCollection } = useLastUsedCollection();

  const initialValues: InputResource<MaterialSample> = {
    ...(materialSample
      ? { ...materialSample }
      : {
          type: "material-sample",
          managedAttributes: {},
          // Defaults to the last Collection used to create a Material Sample:
          collection: lastUsedCollection,
          publiclyReleasable: true
        }),
    determination: materialSample?.determination?.length
      ? materialSample?.determination
      : [{ isPrimary: true, isFileAs: true }]
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
      element.style.backgroundColor = index % 2 === 0 ? "#f3f3f3" : "";
    });
  });

  const { withDuplicateSampleNameCheck } = useDuplicateSampleNameDetection();

  async function onSubmit({
    api: { save },
    formik,
    submittedValues
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    /** Input to submit to the back-end API. */
    const { ...materialSampleInput } = submittedValues;

    // Only persist the preparation fields if the preparations toggle is enabled:
    if (!enablePreparations) {
      Object.assign(materialSampleInput, BLANK_PREPARATION);
    }

    // Only persist the organism fields if toggle is enabled:
    if (!enableOrganism) {
      materialSampleInput.organism = null as any;
    }

    // Only persist the storage link if the Storage toggle is enabled:
    if (!enableStorage) {
      materialSampleInput.storageUnit = {
        id: null,
        type: "storage-unit"
      };
    }

    if (!enableCollectingEvent) {
      // Unlink the CollectingEvent if its switch is unchecked:
      materialSampleInput.collectingEvent = {
        id: null,
        type: "collecting-event"
      };
    } else if (colEventFormRef.current) {
      // Return if the Collecting Event sub-form has errors:
      const colEventErrors = await colEventFormRef.current.validateForm();
      if (!isEmpty(colEventErrors)) {
        formik.setErrors({ ...formik.errors, ...colEventErrors });
        return;
      }

      // Save the linked CollectingEvent if included:
      const submittedCollectingEvent = cloneDeep(
        colEventFormRef.current.values
      );

      const collectingEventWasEdited =
        !submittedCollectingEvent.id ||
        !isEqual(submittedCollectingEvent, collectingEventInitialValues);

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
    }

    if (!enableAcquisitionEvent) {
      // Unlink the AcquisitionEvent if its switch is unchecked:
      materialSampleInput.acquisitionEvent = {
        id: null,
        type: "acquisition-event"
      };
    } else if (acqEventFormRef.current) {
      // Return if the Acq Event sub-form has errors:
      const acqEventErrors = await acqEventFormRef.current.validateForm();
      if (!isEmpty(acqEventErrors)) {
        formik.setErrors({ ...formik.errors, ...acqEventErrors });
        return;
      }

      // Save the linked AcqEvent if included:
      const submittedAcqEvent: PersistedResource<AcquisitionEvent> = cloneDeep(
        acqEventFormRef.current.values
      );

      const acqEventWasEdited =
        !submittedAcqEvent?.id ||
        !isEqual(submittedAcqEvent, acqEventFormRef.current.initialValues);

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
    }

    // Add attachments if they were selected:
    (materialSampleInput as any).relationships.attachment = {
      data:
        materialSampleInput.attachment?.map(it => ({
          id: it.id,
          type: it.type
        })) ?? []
    };
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete materialSampleInput.attachment;

    (materialSampleInput as any).relationships.preparationAttachment = {
      data:
        materialSampleInput.preparationAttachment?.map(it => ({
          id: it.id,
          type: it.type
        })) ?? []
    };
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete materialSampleInput.preparationAttachment;

    // Shuffle the managedAttributesValue to managedAttribute
    materialSampleInput.managedAttributes = {};

    materialSampleInput.managedAttributes = fromPairs(
      toPairs(materialSampleInput.managedAttributeValues).map(value => [
        value[0],
        value[1]?.assignedValue as string
      ])
    );

    delete materialSampleInput.managedAttributeValues;

    // Only persist determination when enabled
    if (!enableDetermination) {
      materialSampleInput.determination = [];
    }

    // convert determination determiner to list
    if (materialSampleInput.determination) {
      for (const determination of materialSampleInput.determination) {
        const determinerRef = determination.determiner;
        if (determinerRef && typeof determinerRef !== "string") {
          determination.determiner = determinerRef.map(it =>
            typeof it !== "string" ? it.id : (null as any)
          );
        }
      }
    }

    if (!enableAssociations) {
      materialSampleInput.associations = [];
      materialSampleInput.hostOrganism = null;
    }

    // Save the MaterialSample:
    const [savedMaterialSample] = await withDuplicateSampleNameCheck(
      async () =>
        await save(
          [
            {
              resource: materialSampleInput,
              type: "material-sample"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        ),
      formik
    );

    await onSaved?.(savedMaterialSample.id);
  }

  /** Re-use the CollectingEvent form layout from the Collecting Event edit page. */
  const nestedCollectingEventForm = (
    <DinaForm
      innerRef={colEventFormRef}
      initialValues={
        isTemplate
          ? colEventTemplateInitialValues
          : collectingEventInitialValues
      }
      validationSchema={collectingEventFormSchema}
      isTemplate={isTemplate}
      readOnly={isTemplate ? !!colEventId : false}
      enabledFields={enabledFields?.collectingEvent}
    >
      <CollectingEventFormLayout
        attachmentsConfig={collectingEventAttachmentsConfig}
      />
    </DinaForm>
  );

  const acqEventProps = {
    innerRef: acqEventFormRef,
    initialValues: isTemplate
      ? acqEventTemplateInitialValues
      : { type: "acquisition-event", ...acquisitionEventInitialValues },
    isTemplate,
    readOnly: isTemplate ? !!acqEventId : false,
    enabledFields: enabledFields?.acquisitionEvent
  };

  const nestedAcqEventForm = acqEventId ? (
    withResponse(acqEventQuery, ({ data }) => (
      <DinaForm {...acqEventProps} initialValues={data}>
        <AcquisitionEventFormLayout />
      </DinaForm>
    ))
  ) : (
    <DinaForm {...acqEventProps}>
      <AcquisitionEventFormLayout />
    </DinaForm>
  );

  return {
    initialValues,
    nestedCollectingEventForm,
    nestedAcqEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    acqEventQuery,
    acqEventId,
    setAcqEventId,
    colEventQuery,
    onSubmit,
    loading
  };
}
