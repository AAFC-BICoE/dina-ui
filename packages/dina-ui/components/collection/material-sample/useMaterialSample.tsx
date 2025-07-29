import {
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  DoOperationsError,
  isResourceEmpty,
  OperationError,
  processExtensionValuesLoading,
  processExtensionValuesSaving,
  resourceDifference,
  SaveArgs,
  useApiClient,
  useQuery,
  useRelationshipUsagesCount,
  withoutBlankFields
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
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
  STORAGE_COMPONENT_NAME,
  ScientificNameSource,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../../dina-ui/types/collection-api";
import { Person } from "../../../../dina-ui/types/objectstore-api";
import { AllowAttachmentsConfig } from "../../object-store";
import { VisibleManagedAttributesConfig } from "./MaterialSampleForm";
import { BLANK_RESTRICTION, RESTRICTIONS_FIELDS } from "./RestrictionField";
import { useGenerateSequence } from "./useGenerateSequence";
import { StorageUnitUsage } from "../../../../dina-ui/types/collection-api/resources/StorageUnitUsage";
import { Alert } from "react-bootstrap";
import CollectingEventEditAlert from "../collecting-event/CollectingEventEditAlert";

export function useMaterialSampleQuery(id?: string | null) {
  const { bulkGet, apiClient } = useApiClient();

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
        "hierarchy",
        "organism",
        "materialSampleChildren",
        "parentMaterialSample",
        "projects",
        "assemblages",
        "storageUnitUsage"
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
                determination.determiner = _.compact(
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

        // Setup the storage unit if it's stored on the storage unit usage.
        if (data?.storageUnitUsage?.id) {
          const storageUnit = await apiClient.get<StorageUnitUsage>(
            `collection-api/storage-unit-usage/${data.storageUnitUsage.id}`,
            {
              include: "storageUnit,storageUnit.parentStorageUnit"
            }
          );

          if (storageUnit?.data?.storageUnit) {
            data.storageUnit = storageUnit.data.storageUnit;
          }
        }

        // Process loaded back-end data into data structure that Formik can use
        if (data.extensionValues) {
          data.extensionValues = processExtensionValuesLoading(
            data.extensionValues
          );
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
    parentAttributes?: string[];
  };

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
  collectingEventRefExternal?: React.RefObject<FormikProps<any>>;
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
  reduceRendering,
  disableNestedFormEdits,
  showChangedIndicatorsInNestedForms,
  visibleManagedAttributeKeys
}: UseMaterialSampleSaveParams) {
  const { save, apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();

  // For editing existing templates:
  const hasColEventTemplate =
    isTemplate &&
    (!_.isEmpty(colEventTemplateInitialValues?.templateCheckboxes) ||
      colEventTemplateInitialValues?.id);

  const hasPreparationsTemplate =
    isTemplate &&
    !_.isEmpty(
      _.pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(PREPARATIONS_COMPONENT_NAME)
      )
    );

  const hasOrganismsTemplate =
    isTemplate &&
    !_.isEmpty(
      _.pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(ORGANISMS_COMPONENT_NAME)
      )
    );

  const hasStorageTemplate =
    isTemplate &&
    !_.isEmpty(
      _.pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(STORAGE_COMPONENT_NAME)
      )
    );

  const hasScheduledActionsTemplate =
    isTemplate &&
    !_.isEmpty(
      _.pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(SCHEDULED_ACTIONS_COMPONENT_NAME)
      )
    );

  const hasAssociationsTemplate =
    isTemplate &&
    !_.isEmpty(
      _.pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(ASSOCIATIONS_COMPONENT_NAME)
      )
    );

  const hasRestrictionsTemplate =
    isTemplate &&
    !_.isEmpty(
      _.pickBy(
        materialSampleTemplateInitialValues?.templateCheckboxes,
        (_, key) => key.startsWith(RESTRICTION_COMPONENT_NAME)
      )
    );

  const hasShowParentAttributes =
    isTemplate &&
    (materialSampleTemplateInitialValues?.parentAttributes?.length ?? 0) > 0;

  // Enable Switch States:
  const [enableShowParentAttributes, setEnableShowParentAttributes] =
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

  // Delete Data Component
  const [deleteCollectingEvent, setDeleteCollectingEvent] =
    useState<boolean>(false);
  const [deletePreparations, setDeletePreparations] = useState<boolean>(false);
  const [deleteOrganisms, setDeleteOrganisms] = useState<boolean>(false);
  const [deleteStorage, setDeleteStorage] = useState<boolean>(false);
  // const [deleteScheduledActions, setDeleteScheduledActions] =
  //   useState<boolean>(false);
  const [deleteAssociations, setDeleteAssociations] = useState<boolean>(false);
  const [deleteRestrictions, setDeleteRestrictions] = useState<boolean>(false);

  // Hook to check for material sample usages.
  const { usageCount: materialSampleUsageCount } = useRelationshipUsagesCount({
    apiClient,
    resourcePath: "collection-api/material-sample",
    relationshipName: "collectingEvent",
    relationshipId: materialSample?.collectingEvent?.id ?? undefined
  });

  // Setup the enabled fields state based on the form template being used.
  useEffect(() => {
    setEnableShowParentAttributes(
      Boolean(
        hasShowParentAttributes
          ? true
          : formTemplate?.components?.find(
              (comp) =>
                comp.name === SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME &&
                comp.visible
            )?.visible ?? false
      )
    );
    setEnableCollectingEvent(
      Boolean(
        hasColEventTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: COLLECTING_EVENT_COMPONENT_NAME
            })?.visible ?? false
          : materialSample?.collectingEvent
      )
    );

    setEnablePreparations(
      Boolean(
        hasPreparationsTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: PREPARATIONS_COMPONENT_NAME
            })?.visible ?? false
          : PREPARATION_FIELDS.some(
              (prepFieldName) => !_.isEmpty(materialSample?.[prepFieldName])
            )
      )
    );

    setEnableOrganisms(
      Boolean(
        hasOrganismsTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: ORGANISMS_COMPONENT_NAME
            })?.visible ?? false
          : materialSample?.organism?.length
      )
    );

    setEnableStorage(
      // Show the Storage section if the storage field is set or the template enables it:
      Boolean(
        hasStorageTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: STORAGE_COMPONENT_NAME
            })?.visible ?? false
          : materialSample?.storageUnitUsage?.id
      )
    );

    setEnableScheduledActions(
      // Show the Scheduled Actions section if the field is set or the template enables it:
      Boolean(
        hasScheduledActionsTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: SCHEDULED_ACTIONS_COMPONENT_NAME
            })?.visible ?? false
          : materialSample?.scheduledActions?.length
      )
    );

    setEnableAssociations(
      // Show the associations section if the field is set or the template enables it:
      Boolean(
        hasAssociationsTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: ASSOCIATIONS_COMPONENT_NAME
            })?.visible ?? false
          : materialSample?.associations?.length ||
            !_.isEmpty(materialSample?.hostOrganism) ||
            !_.isEmpty(materialSample?.associations)
      )
    );

    setEnableRestrictions(
      Boolean(
        hasRestrictionsTemplate
          ? true
          : formTemplate
          ? _.find(formTemplate?.components, {
              name: RESTRICTION_COMPONENT_NAME
            })?.visible ?? false
          : RESTRICTIONS_FIELDS.some(
              (restrictFieldName) =>
                !_.isEmpty(materialSample?.[restrictFieldName])
            )
      )
    );
  }, [formTemplate]);

  // The state describing which Data components (Form sections) are enabled:
  const dataComponentState = {
    // Collecting Event
    enableCollectingEvent,
    setEnableCollectingEvent,
    setDeleteCollectingEvent,

    // Preparations
    enablePreparations,
    setEnablePreparations,
    setDeletePreparations,

    // Organisms
    enableOrganisms,
    setEnableOrganisms,
    setDeleteOrganisms,

    // Storage
    enableStorage,
    setEnableStorage,
    setDeleteStorage,

    // Scheduled Actions
    enableScheduledActions,
    setEnableScheduledActions,

    // Associations
    enableAssociations,
    setEnableAssociations,
    setDeleteAssociations,

    // Restrictions
    enableRestrictions,
    setEnableRestrictions,
    setDeleteRestrictions,

    // Parent Attributes (Form template only)
    enableShowParentAttributes,
    setEnableShowParentAttributes
  };

  const { loading, lastUsedCollection } = useLastUsedCollection();

  const defaultValues: InputResource<MaterialSample> = {
    type: "material-sample",
    // Defaults to the last Collection used to create a Material Sample:
    ...(lastUsedCollection && { collection: lastUsedCollection }),
    publiclyReleasable: true
  };

  const msInitialValues: InputResource<MaterialSample> =
    withOrganismEditorValues(materialSample ?? defaultValues);
  if (msInitialValues.identifiers) {
    (msInitialValues as any).identifiers = Object.entries(
      msInitialValues.identifiers
    ).map(([type, value]) => ({ type, value }));
  }

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
    if (Object.keys(submittedValues.restrictionFieldsExtension).length === 0) {
      delete submittedValues.restrictionFieldsExtension;
    }

    if (submittedValues.extensionValues) {
      submittedValues.extensionValues = processExtensionValuesSaving(
        submittedValues.extensionValues
      );
    }

    // Other identifiers saving
    if (submittedValues.identifiers) {
      const otherIdentifiers = (submittedValues.identifiers as any).reduce(
        (acc, identifier) => {
          if (identifier.type && identifier.value) {
            acc[identifier.type] = identifier.value;
          }
          return acc;
        },
        {}
      );

      if (otherIdentifiers && Object.keys(otherIdentifiers).length > 0) {
        submittedValues.identifiers = otherIdentifiers;
      } else if (
        msInitialValues.identifiers &&
        Object.keys(msInitialValues.identifiers).length !== 0
      ) {
        submittedValues.identifiers = {};
      } else {
        delete submittedValues.identifiers;
      }
    }

    // Remove empty items from dwcOtherCatalogNumbers
    if (submittedValues.dwcOtherCatalogNumbers) {
      const otherCatalogNumbers = (
        submittedValues.dwcOtherCatalogNumbers as any
      ).filter((catNum) => catNum !== "");

      if (otherCatalogNumbers.length !== 0) {
        submittedValues.dwcOtherCatalogNumbers = otherCatalogNumbers;
      } else if (
        msInitialValues.dwcOtherCatalogNumbers &&
        msInitialValues.dwcOtherCatalogNumbers.length !== 0
      ) {
        (submittedValues.dwcOtherCatalogNumbers as any) = null;
      } else {
        // Can be removed if it's not being cleared or set.
        delete submittedValues.dwcOtherCatalogNumbers;
      }
    }

    /** Input to submit to the back-end API. */
    const materialSampleInput: InputResource<MaterialSample> = {
      ...submittedValues,

      // Remove the values from sections that were toggled off:
      ...(deletePreparations && BLANK_PREPARATION),
      ...(deleteRestrictions && BLANK_RESTRICTION),
      ...(deleteOrganisms && {
        organismsIndividualEntry: undefined,
        organismsQuantity: undefined,
        organism: []
      }),
      // Remove storageUnit and storageUnitUsage if toggle is disabled
      ...(deleteStorage && {
        storageUnitUsage: { id: null, type: "storage-unit-usage" }
      }),
      ...(deleteCollectingEvent && {
        collectingEvent: { id: null, type: "collecting-event" }
      }),
      ...(deleteAssociations && {
        associations: [],
        ...(msInitialValues.hostOrganism && { hostOrganism: null })
      })
    };
    delete materialSampleInput.scheduledActions;

    // Throw error if useTargetOrganism is enabled without a target organism selected
    if (
      materialSampleInput.useTargetOrganism &&
      !materialSampleInput.organism?.some((organism) => organism?.isTarget)
    ) {
      throw new DoOperationsError(
        formatMessage("field_useTargetOrganismError")
      );
    }

    // Remote the empty scientificNameDetails.classificationPath and scientificNameDetails.classificationRanks
    if (
      materialSampleInput.organism &&
      materialSampleInput.organism.length > 0
    ) {
      materialSampleInput.organism?.forEach((ogsm) => {
        if (ogsm?.determination && ogsm.determination.length > 0) {
          ogsm.determination.forEach((dtm) => {
            // If this is manual classification input
            if (
              dtm.scientificNameSource === ScientificNameSource.CUSTOM &&
              dtm.scientificNameDetails
            ) {
              const pathArray =
                dtm.scientificNameDetails.classificationPath?.split("|") ?? [];
              const rankArray =
                dtm.scientificNameDetails.classificationRanks?.split("|") ?? [];
              const firstEmptyIndex = pathArray.findIndex(
                (path, index) => path === "" && rankArray[index] === ""
              );
              if (firstEmptyIndex > -1) {
                dtm.scientificNameDetails.classificationRanks = rankArray
                  .slice(0, firstEmptyIndex)
                  .join("|");
                dtm.scientificNameDetails.classificationPath = pathArray
                  .slice(0, firstEmptyIndex)
                  .join("|");
              }
            }
          });
        }
      });
    }

    delete materialSampleInput.phac_animal_rg;
    delete materialSampleInput.phac_cl;
    delete materialSampleInput.phac_human_rg;
    delete materialSampleInput.cfia_ppc;
    delete materialSampleInput.useTargetOrganism;
    delete materialSampleInput.parentAttributes;

    return materialSampleInput;
  }

  /**
   * Gets the diff of the form's initial values to the new sample state,
   * so only edited values are submitted to the back-end.
   */
  async function prepareSampleSaveOperation({
    submittedValues,
    preProcessSample,
    collectingEventRefExternal
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

    // Save and link the Collecting Event if enabled:
    const colEventFormRefToUse = colEventFormRef?.current?.values
      ? colEventFormRef
      : collectingEventRefExternal;
    if (colEventFormRefToUse?.current) {
      const collectingEventValues = {
        ...withoutBlankFields(colEventFormRef?.current?.values),
        ...withoutBlankFields(collectingEventRefExternal?.current?.values)
      };
      colEventFormRefToUse.current.values = collectingEventValues;
    }

    if (
      (enableCollectingEvent || collectingEventRefExternal) &&
      colEventFormRefToUse?.current
    ) {
      // Save the linked CollectingEvent if included:
      const submittedCollectingEvent = _.cloneDeep(
        colEventFormRefToUse.current.values
      );

      const collectingEventWasEdited =
        !submittedCollectingEvent.id ||
        !_.isEqual(submittedCollectingEvent, collectingEventInitialValues);

      try {
        // Throw if the Collecting Event sub-form has errors:
        const colEventErrors =
          await colEventFormRefToUse?.current?.validateForm();
        if (!_.isEmpty(colEventErrors)) {
          throw new DoOperationsError("", colEventErrors);
        }
        // Only send the save request if the Collecting Event was edited:
        const savedCollectingEvent = collectingEventWasEdited
          ? // Use the same save method as the Collecting Event page:
            await saveCollectingEvent(
              submittedCollectingEvent,
              colEventFormRefToUse.current
            )
          : submittedCollectingEvent;

        // Set the ColEventId here in case the next operation fails:
        setColEventId(savedCollectingEvent.id);

        // Link the MaterialSample to the CollectingEvent:
        if (
          !msInitialValues.id ||
          msInitialValues?.collectingEvent?.id !==
            submittedCollectingEvent?.id ||
          !msInitialValues.collectingEvent
        ) {
          msDiff.collectingEvent = {
            id: savedCollectingEvent.id,
            type: savedCollectingEvent.type
          };
        }
      } catch (error: unknown) {
        if (error instanceof DoOperationsError) {
          // Put the error messages into both form states:
          colEventFormRefToUse.current.setStatus(error.message);
          colEventFormRefToUse.current.setErrors(error.fieldErrors);
          const newOpError = new DoOperationsError(
            error.message,
            _.mapKeys(
              error.fieldErrors,
              (_, field) => `collectingEvent.${field}`
            )
          );
          throw newOpError;
        }
        throw error;
      }
    }

    // Check if there is any changes to the storage unit or storage unit usage.
    if (msDiff?.storageUnit?.id || msDiff?.storageUnitUsage?.id) {
      // Create new storageUnitUsage, the storageUnit is saved here.
      const storageUnitUsageSaveArgs: SaveArgs<StorageUnitUsage>[] = [
        {
          type: "storage-unit-usage",
          resource: {
            ...(_.pick(
              msDiff.storageUnitUsage,
              "wellRow",
              "wellColumn"
            ) as StorageUnitUsage),
            storageUnit: msPreprocessed?.storageUnit?.id
              ? _.pick(msPreprocessed.storageUnit, "id", "type")
              : undefined,
            type: "storage-unit-usage",
            id: msPreprocessed.storageUnitUsage?.id ?? undefined,
            usageType: "material-sample"
          }
        }
      ];

      const savedStorageUnitUsage = await save<StorageUnitUsage>(
        storageUnitUsageSaveArgs,
        {
          apiBaseUrl: "/collection-api"
        }
      );

      // Create link between material sample and created storageUnitUsage resource
      msDiff.storageUnitUsage = savedStorageUnitUsage[0];
    }

    // If the storage unit is set to null in the diff then the storage unit usage should also be removed.
    if (msDiff?.storageUnit?.id === null) {
      msDiff.storageUnitUsage = {
        id: null,
        type: "storage-unit-usage"
      };
    }

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

      // Kitsu serialization can't tell the difference between an array attribute and an array relationship.
      // Explicitly declare these fields as relationships here before saving:
      // One-to-many relationships go in the 'relationships' object:
      relationships: {
        ...(msDiffWithOrganisms.attachment && {
          attachment: {
            data: msDiffWithOrganisms.attachment.map((it) =>
              _.pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.projects && {
          projects: {
            data: msDiffWithOrganisms.projects.map((it) =>
              _.pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.assemblages && {
          assemblages: {
            data: msDiffWithOrganisms.assemblages.map((it) =>
              _.pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.organism && {
          organism: {
            data: msDiffWithOrganisms.organism.map((it) =>
              _.pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.preparedBy && {
          preparedBy: {
            data: msDiffWithOrganisms.preparedBy.map((it) =>
              _.pick(it, "id", "type")
            )
          }
        }),
        ...(msDiffWithOrganisms.preparationType?.id && {
          preparationType: {
            data: _.pick(msDiffWithOrganisms.preparationType, "id", "type")
          }
        }),
        ...(msDiffWithOrganisms.collection?.id && {
          collection: {
            data: _.pick(msDiffWithOrganisms.collection, "id", "type")
          }
        }),
        ...(msDiffWithOrganisms.storageUnitUsage && {
          storageUnitUsage: {
            data: msDiffWithOrganisms.storageUnitUsage?.id
              ? _.pick(msDiffWithOrganisms.storageUnitUsage, "id", "type")
              : null
          }
        })
      }
    };

    // These values are not submitted to the back-end:
    delete msInputWithRelationships.organismsIndividualEntry;
    delete msInputWithRelationships.organismsQuantity;

    // Delete these since they have been moved to the relationship section.
    delete msInputWithRelationships.attachment;
    delete msInputWithRelationships.projects;
    delete msInputWithRelationships.organism;
    delete msInputWithRelationships.assemblages;
    delete msInputWithRelationships.preparedBy;
    delete msInputWithRelationships.storageUnitUsage;
    delete msInputWithRelationships.storageUnit;

    // If the relationship section is empty, remove it from the query.
    if (Object.keys(msInputWithRelationships.relationships).length === 0) {
      delete msInputWithRelationships.relationships;
    }

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
    const preparedOrganisms: Organism[] = _.range(
      0,
      sample.organismsQuantity ?? undefined
    )
      .map((index) => {
        const defaults = {
          // Default to the sample's group:
          group: sample.group,
          type: "organism" as const
        };

        const { id: _firstOrganismId, ...firstOrganismValues } =
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
          fieldErrors: _.mapKeys(
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
        async () => {
          // Do not perform any request if it's empty...
          if (
            isResourceEmpty(materialSampleSaveOp.resource) &&
            materialSampleSaveOp?.resource?.id
          ) {
            return [
              materialSampleSaveOp?.resource
            ] as PersistedResource<MaterialSample>[];
          }

          return await save<MaterialSample>([materialSampleSaveOp], {
            apiBaseUrl: "/collection-api"
          });
        },
        formik
      );

      // Delete storageUnitUsage if there is one when no StorageUnit linked
      if (
        (!enableStorage || !submittedValues.storageUnit?.id) &&
        submittedValues.storageUnitUsage?.id
      ) {
        await save<StorageUnitUsage>(
          [
            {
              delete: {
                id: submittedValues.storageUnitUsage?.id ?? null,
                type: "storage-unit-usage"
              }
            }
          ],
          {
            apiBaseUrl: "/collection-api"
          }
        );
      }

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
      readOnly:
        (materialSampleUsageCount && materialSampleUsageCount > 1) ||
        disableNestedFormEdits ||
        isTemplate
          ? !!colEventId
          : false,
      formTemplate,
      children: reduceRendering ? (
        <div />
      ) : (
        <div className={nestedFormClassName}>
          {materialSampleUsageCount && materialSampleUsageCount > 1 && (
            <CollectingEventEditAlert
              materialSampleUsageCount={materialSampleUsageCount}
            />
          )}
          <CollectingEventFormLayout
            visibleManagedAttributeKeys={
              visibleManagedAttributeKeys?.collectingEvent
            }
            attachmentsConfig={collectingEventAttachmentsConfig}
          />
        </div>
      )
    };

    // Check the request to see if a permission provider is present.
    const permissionsProvided = initialValues?.meta?.permissionsProvider;

    const canEdit = permissionsProvided
      ? initialValues?.meta?.permissions?.includes(
          colEvent?.id ? "update" : "create"
        ) ?? false
      : true;

    const isEditDisabled = colEventFormProps.readOnly || !canEdit;
    const showAlert = !canEdit && !colEventFormProps.readOnly;

    return (
      <>
        {showAlert && (
          <Alert variant="warning" className="mb-2">
            <DinaMessage id="collectingEventPermissionAlert" />
          </Alert>
        )}
        <DinaForm {...colEventFormProps} readOnly={isEditDisabled} />
      </>
    );
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
    loading,
    colEventFormRef
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

    return !_.isEqual(firstOrgValues, thisOrgValues);
  });

  return {
    ...materialSample,
    // Client-side-only organisms UI fields:
    organismsQuantity: materialSample?.organism?.length,
    organismsIndividualEntry: hasDifferentOrganisms
  };
}
