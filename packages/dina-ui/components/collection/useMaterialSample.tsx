import { InputResource, PersistedResource } from "kitsu";
import {
  DinaFormSubmitParams,
  useApiClient,
  useModal,
  useQuery
} from "../../../common-ui/lib";
import { MaterialSample } from "../../../dina-ui/types/collection-api";
import { Metadata } from "../../../dina-ui/types/objectstore-api";
import { FormikProps } from "formik";
import { useCollectingEventQuery, useCollectingEventSave } from ".";
import { useAttachmentsModal } from "../object-store";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { cloneDeep, isEmpty } from "lodash";

import { AreYouSureModal, DinaForm } from "common-ui";
import { CollectingEventFormLayout } from "../../components/collection";

export function useMaterialSampleQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include: "collectingEvent,attachment,preparationType"
    },
    {
      disabled: !id,
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

export function useMaterialSampleSave(
  materialSample?: PersistedResource<MaterialSample>,
  onSaved?: (id: string) => Promise<void>,
  isTemplate?: boolean,
  collectingEvtFormRef?: React.Ref<FormikProps<any>>
) {
  const { openModal } = useModal();

  const [enableCollectingEvent, setEnableCollectingEvent] = useState(
    !!materialSample?.collectingEvent
  );

  const hasPreparations = !!materialSample?.preparationType;
  const [enablePreparations, setEnablePreparations] = useState(hasPreparations);

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
    materialSample?.collectingEvent?.id
  );
  const colEventQuery = useCollectingEventQuery(colEventId);

  const {
    collectingEventInitialValues,
    saveCollectingEvent,
    attachedMetadatasUI: colEventAttachmentsUI,
    collectingEventFormSchema
  } = useCollectingEventSave(colEventQuery.response?.data, isTemplate);

  const {
    attachedMetadatasUI: materialSampleAttachmentsUI,
    selectedMetadatas
  } = useAttachmentsModal({
    initialMetadatas:
      materialSample?.attachment as PersistedResource<Metadata>[],
    deps: [materialSample?.id],
    title: <DinaMessage id="materialSampleAttachments" />,
    isTemplate,
    allowNewFieldName: "materialSampleAllowNew",
    allowExistingFieldName: "materialSampleAllowExisting",
    id: "material-sample-attachments-section"
  });

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

    // Only persist the preparation type if the preparations toggle is enabled:
    if (!enablePreparations) {
      materialSampleInput.preparationType = {
        id: null,
        type: "preparation-type"
      };
    }

    if (!enableCollectingEvent) {
      // Unlink the CollectingEvent if its switch is unchecked:
      materialSampleInput.collectingEvent = {
        id: null,
        type: "collecting-event"
      };
    } else if ((colEventFormRef as any).current) {
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
      // Use the same save method as the Collecting Event page:
      const savedCollectingEvent = await saveCollectingEvent(
        submittedCollectingEvent,
        (colEventFormRef as any).current
      );

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
      initialValues={collectingEventInitialValues}
      validationSchema={collectingEventFormSchema}
      isTemplate={isTemplate}
      readOnly={isTemplate ? !!colEventId : false}
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
