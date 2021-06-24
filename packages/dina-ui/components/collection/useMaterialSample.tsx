import { AreYouSureModal, DinaForm } from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { cloneDeep, isEmpty, isEqual } from "lodash";
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { useCollectingEventQuery, useCollectingEventSave } from ".";
import {
  DinaFormSubmitParams,
  useApiClient,
  useModal,
  useQuery
} from "../../../common-ui/lib";
import {
  CollectingEvent,
  MaterialSample
} from "../../../dina-ui/types/collection-api";
import { Metadata } from "../../../dina-ui/types/objectstore-api";
import { CollectingEventFormLayout } from "../../components/collection";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { AllowAttachmentsConfig, useAttachmentsModal } from "../object-store";

export function useMaterialSampleQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include:
        "collectingEvent,attachment,preparationType,materialSampleType,preparedBy,storageUnit"
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
  preparationsTemplateInitialValues?: Partial<MaterialSample> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };

  /** Optionally restrict the form to these enabled fields. */
  enabledFields?: {
    materialSample?: string[];
    collectingEvent?: string[];
  };

  materialSampleAttachmentsConfig?: AllowAttachmentsConfig;
  collectingEventAttachmentsConfig?: AllowAttachmentsConfig;
}

const PREPARATION_FIELDS: (keyof MaterialSample)[] = [
  "preparationType",
  "preparationDate",
  "preparedBy"
];

export function useMaterialSampleSave({
  materialSample,
  collectingEventInitialValues: collectingEventInitialValuesProp,
  onSaved,
  collectingEvtFormRef,
  isTemplate,
  colEventTemplateInitialValues,
  enabledFields,
  materialSampleAttachmentsConfig,
  collectingEventAttachmentsConfig,
  preparationsTemplateInitialValues
}: UseMaterialSampleSaveParams) {
  const { openModal } = useModal();

  // For editing existing templates:
  const hasColEventTemplate =
    isTemplate &&
    (!isEmpty(colEventTemplateInitialValues?.templateCheckboxes) ||
      colEventTemplateInitialValues?.id);
  // For editing existing templates:
  const hasPreparationsTemplate =
    isTemplate &&
    !isEmpty(preparationsTemplateInitialValues?.templateCheckboxes);

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

  const initialValues: InputResource<MaterialSample> = materialSample
    ? { ...materialSample }
    : {
        type: "material-sample"
        // managedAttributeValues: {}
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
    attachedMetadatasUI: colEventAttachmentsUI,
    collectingEventFormSchema
  } = useCollectingEventSave({
    attachmentsConfig: collectingEventAttachmentsConfig,
    fetchedCollectingEvent: colEventQuery.response?.data,
    isTemplate
  });

  const {
    attachedMetadatasUI: materialSampleAttachmentsUI,
    selectedMetadatas
  } = useAttachmentsModal({
    initialMetadatas:
      materialSample?.attachment as PersistedResource<Metadata>[],
    deps: [materialSample?.id],
    title: <DinaMessage id="materialSampleAttachments" />,
    isTemplate,
    allowAttachmentsConfig: materialSampleAttachmentsConfig,
    allowNewFieldName: "attachmentsConfig.allowNew",
    allowExistingFieldName: "attachmentsConfig.allowExisting",
    id: "material-sample-attachments-section"
  });

  const collectingEventInitialValues =
    collectingEventInitialValuesProp ?? collectingEventHookInitialValues;

  // Add zebra-striping effect to the form sections. Every second top-level fieldset should have a grey background.
  useLayoutEffect(() => {
    const dataComponents = document?.querySelectorAll<HTMLDivElement>(
      ".data-components > fieldset:not(.d-none)"
    );
    dataComponents?.forEach((element, index) => {
      element.style.backgroundColor = index % 2 === 0 ? "#f3f3f3" : "";
    });
  });

  /** Wraps the useState setter with an AreYouSure modal when setting to false. */
  function dataComponentToggler(
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
      materialSampleInput.preparationType = {
        id: null,
        type: "preparation-type"
      };
      materialSampleInput.preparationDate = null;
      materialSampleInput.preparedBy = { id: null };
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
    if (selectedMetadatas.length) {
      (materialSampleInput as any).relationships.attachment = {
        data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
      };
    }
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete materialSampleInput.attachment;

    // Save the MaterialSample:
    const [savedMaterialSample] = await save(
      [
        {
          resource: materialSampleInput,
          type: "material-sample"
        }
      ],
      { apiBaseUrl: "/collection-api" }
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
      <CollectingEventFormLayout />
      <div className="mb-3">{colEventAttachmentsUI}</div>
    </DinaForm>
  );

  return {
    initialValues,
    nestedCollectingEventForm,
    dataComponentToggler,
    enablePreparations,
    setEnablePreparations,
    enableCollectingEvent,
    setEnableCollectingEvent,
    colEventId,
    setColEventId,
    colEventQuery,
    materialSampleAttachmentsUI,
    onSubmit
  };
}
