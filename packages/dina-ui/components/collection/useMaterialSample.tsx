import {
  AreYouSureModal,
  DinaForm,
  DinaFormSubmitParams,
  useApiClient,
  useModal,
  useQuery
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, KitsuResponse } from "kitsu";
import { cloneDeep, fromPairs, isEmpty, isEqual, pick, toPairs } from "lodash";
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
  MutableRefObject
} from "react";
import { useCollectingEventQuery, useCollectingEventSave } from ".";
import { SCHEDULEDACTION_FIELDS } from "..";
import {
  CollectingEvent,
  MaterialSample
} from "../../../dina-ui/types/collection-api";
import {
  ManagedAttributeValues,
  Metadata,
  Person
} from "../../../dina-ui/types/objectstore-api";
import { CollectingEventFormLayout } from "../../components/collection";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { HOSTORGANISM_FIELDS } from "./AssociationsField";
import { AllowAttachmentsConfig } from "../object-store";
import { DETERMINATION_FIELDS } from "./DeterminationField";
import { MATERIALSAMPLE_ASSOCIATION_FIELDS } from "./MaterialSampleAssociationsField";
import { ORGANISM_FIELDS } from "./OrganismStateField";
import { BLANK_PREPARATION, PREPARATION_FIELDS } from "./PreparationField";
import { useLastUsedCollection } from "./useLastUsedCollection";

export function useMaterialSampleQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include: [
        "collection",
        "collectingEvent",
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
        if (data.attachment) {
          try {
            const metadatas = await bulkGet<Metadata>(
              data.attachment.map(collector => `/metadata/${collector.id}`),
              {
                apiBaseUrl: "/objectstore-api",
                returnNullForMissingResource: true
              }
            );
            // Omit null (deleted) records:
            data.attachment = metadatas.filter(it => it);
          } catch (error) {
            console.warn("Attachment join failed: ", error);
          }
        }
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
              determination.determiner = await bulkGet<Person>(
                determination.determiner.map(
                  (personId: string) => `/person/${personId}`
                ),
                {
                  apiBaseUrl: "/agent-api",
                  returnNullForMissingResource: true
                }
              );
            }
          }
        }
        if (data.materialSampleChildren) {
          data.materialSampleChildren = await bulkGet<MaterialSample>(
            data.materialSampleChildren.map(
              child => `/material-sample/${child.id}?include=materialSampleType`
            ),
            {
              apiBaseUrl: "/collection-api",
              returnNullForMissingResource: true
            }
          );
        }
        /* Map associated sample to primary id if there is one for display purpose */
        if (data.associations) {
          const associatedMaterialSamples: MaterialSample[] =
            await bulkGet<MaterialSample>(
              data.associations.map(
                assctn => `/material-sample/${assctn.associatedSample}`
              ),
              {
                apiBaseUrl: "/collection-api",
                returnNullForMissingResource: true
              }
            );
          for (const association of associatedMaterialSamples) {
            data.associations
              .filter(assctn => association.id === assctn.associatedSample)
              .map(
                assctn =>
                  (assctn.associatedSample = !!association.materialSampleName
                    ?.length
                    ? association.materialSampleName
                    : association.id)
              );
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

  collectingEvtFormRef?: React.RefObject<FormikProps<any>>;

  isTemplate?: boolean;

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
  };

  collectingEventAttachmentsConfig?: AllowAttachmentsConfig;

  associatedSampleMapRef?: MutableRefObject<Map<string, string>>;
}

export function useMaterialSampleSave({
  materialSample,
  collectingEventInitialValues: collectingEventInitialValuesProp,
  onSaved,
  collectingEvtFormRef,
  isTemplate,
  enabledFields,
  collectingEventAttachmentsConfig,
  colEventTemplateInitialValues,
  materialSampleTemplateInitialValues,
  associatedSampleMapRef
}: UseMaterialSampleSaveParams) {
  const { openModal } = useModal();

  // For editing existing templates:
  const hasColEventTemplate =
    isTemplate &&
    (!isEmpty(colEventTemplateInitialValues?.templateCheckboxes) ||
      colEventTemplateInitialValues?.id);
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
      pick(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        ...DETERMINATION_FIELDS.map(field => `determination[0].${field}`)
      )
    );

  const hasScheduledActionsTemplate =
    isTemplate &&
    !isEmpty(
      pick(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        SCHEDULEDACTION_FIELDS.map(fieldName => `scheduledAction.${fieldName}`)
      )
    );

  const hasAssociationsTemplate =
    isTemplate &&
    (!isEmpty(
      pick(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        MATERIALSAMPLE_ASSOCIATION_FIELDS.map(
          fieldName => `association.${fieldName}`
        )
      )
    ) ||
      !isEmpty(
        pick(
          materialSampleTemplateInitialValues?.templateCheckboxes,
          HOSTORGANISM_FIELDS.map(fieldName => `hostOrganism.${fieldName}`)
        )
      ));

  const [enableCollectingEvent, setEnableCollectingEvent] = useState(
    Boolean(
      hasColEventTemplate ||
        materialSample?.collectingEvent ||
        enabledFields?.collectingEvent?.length
    )
  );

  const [enablePreparations, setEnablePreparations] = useState(
    Boolean(
      hasPreparationsTemplate ||
        // Show the preparation section if a field is set or the field is enabled:
        PREPARATION_FIELDS.some(
          prepFieldName =>
            materialSample?.[prepFieldName] ||
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
        materialSample?.determination?.some(det => !isEmpty(det)) ||
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
        HOSTORGANISM_FIELDS.some(
          organismFieldName =>
            materialSample?.hostOrganism?.[`${organismFieldName}`] ||
            enabledFields?.materialSample?.includes(
              `hostOrganism.${organismFieldName}`
            )
        ) ||
        enabledFields?.materialSample?.some(
          enabledField =>
            enabledField.startsWith("association.") ||
            enabledField.startsWith("hostOrganism.")
        )
    )
  );

  // The state describing which Data components (Form sections) are enabled:
  const dataComponentState = {
    enableCollectingEvent,
    setEnableCollectingEvent,
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
      : [{ isPrimary: true }]
  };

  /** Used to get the values of the nested CollectingEvent form. */
  const colEventFormRef =
    collectingEvtFormRef ?? useRef<FormikProps<any>>(null);

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
      element.style.backgroundColor = index % 2 === 0 ? "#f3f3f3" : "";
    });
  });

  async function onSubmit({
    api: { save, apiClient },
    formik,
    submittedValues
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    /** Input to submit to the back-end API. */
    const { ...materialSampleInput } = submittedValues;

    async function saveAndProceed(mtrSmplIpt) {
      // Save the MaterialSample:
      const [savedMaterialSample] = await save(
        [
          {
            resource: mtrSmplIpt,
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
      await onSaved?.(savedMaterialSample.id);
    }

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
      const colEventErrors = await (
        colEventFormRef as any
      ).current.validateForm();
      if (!isEmpty(colEventErrors)) {
        formik.setErrors({ ...formik.errors, ...colEventErrors });
        return;
      }

      // Save the linked CollectingEvent if included:
      const submittedCollectingEvent = cloneDeep(
        (colEventFormRef as any).current.values
      );

      const collectingEventWasEdited = !isEqual(
        submittedCollectingEvent,
        collectingEventInitialValues
      );
      // Only send the save request if the Collecting Event was edited:
      const savedCollectingEvent = collectingEventWasEdited
        ? // Use the same save method as the Collecting Event page:
          await saveCollectingEvent(
            submittedCollectingEvent,
            (colEventFormRef as any).current
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

    delete materialSampleInput.association;

    // convert associated material sample from primary id to uuid for saving
    if (!!materialSampleInput.associations?.length) {
      const promises: Promise<KitsuResponse<MaterialSample[], undefined>>[] =
        [];
      materialSampleInput.associations?.map(async assctn => {
        const id = associatedSampleMapRef?.current.get(
          assctn.associatedSample as any
        );
        if (id) {
          assctn.associatedSample = id;
        } else {
          promises.push(
            apiClient.get<MaterialSample[]>("collection-api/material-sample", {
              fields: {
                "material-sample": "id,materialSampleName"
              },
              filter: {
                rsql: `materialSampleName==${assctn.associatedSample}`
              },
              page: { limit: 1000 }
            })
          );
        }
      });

      // Set the associatedSample to id if it does not exist in the live map
      Promise.all(promises).then(async results => {
        materialSampleInput.associations?.map(assctn => {
          // Take the first sample whose sampleName match the one about to sent for save
          // duplication is not handled by design for now
          results.map(result => {
            if (
              assctn.associatedSample === result.data?.[0]?.materialSampleName
            ) {
              associatedSampleMapRef?.current.set(
                assctn.associatedSample as string,
                result?.data?.[0]?.id
              );
              assctn.associatedSample = result?.data?.[0]?.id;
            }
          });
        });
        saveAndProceed(materialSampleInput);
      });
    } else {
      saveAndProceed(materialSampleInput);
    }
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

  return {
    initialValues,
    nestedCollectingEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    colEventQuery,
    onSubmit,
    loading
  };
}
