import {
  AreYouSureModal,
  ButtonBar,
  DinaForm,
  DinaFormSection,
  DinaFormSubmitParams,
  FieldSet,
  SubmitButton,
  TextField,
  useModal,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { PersistedResource } from "kitsu";
import { get, isEmpty, mapValues, pick, set, toPairs } from "lodash";
import { useRouter } from "next/router";
import React, { RefObject, useRef, useState } from "react";
import { Promisable } from "type-fest";
import * as yup from "yup";
import { GroupSelectField, Head, Nav } from "../../../components";
import { useMaterialSampleSave } from "../../../components/collection/useMaterialSample";
import { useAttachmentsModal } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  FormTemplate,
  PreparationProcessDefinition,
  TemplateField,
  TemplateFields
} from "../../../types/collection-api";
import {
  MaterialSampleForm,
  PreparationsFormLayout
} from "../material-sample/edit";

const workflowMainFieldsSchema = yup.object({
  id: yup.string(),
  name: yup.string().trim().required(),
  group: yup.string().required()
});

type WorkflowFormValues = yup.InferType<typeof workflowMainFieldsSchema>;

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const id = router.query.id?.toString();

  const workflowTemplateQuery = useQuery<PreparationProcessDefinition>(
    { path: `/collection-api/material-sample-action-definition/${id}` },
    { disabled: !id }
  );

  const pageTitle = id
    ? "editWorkflowTemplateTitle"
    : "createWorkflowTemplateTitle";

  async function moveToNextPage() {
    await router.push("/collection/workflow-template/list");
  }

  return (
    <div>
      <Head title={formatMessage(pageTitle)} />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id={pageTitle} />
        </h1>
        {id ? (
          withResponse(workflowTemplateQuery, ({ data: fetchedDefinition }) => (
            <WorkflowTemplateForm
              fetchedActionDefinition={fetchedDefinition}
              onSaved={moveToNextPage}
            />
          ))
        ) : (
          <WorkflowTemplateForm onSaved={moveToNextPage} />
        )}
      </div>
    </div>
  );
}

export interface WorkflowTemplateFormProps {
  fetchedActionDefinition?: PersistedResource<PreparationProcessDefinition>;
  onSaved: (
    savedDefinition: PersistedResource<PreparationProcessDefinition>
  ) => Promisable<void>;
}

export function WorkflowTemplateForm({
  fetchedActionDefinition,
  onSaved
}: WorkflowTemplateFormProps) {
  const { formatMessage } = useDinaIntl();

  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const preparationsAndAttachmentsFormRef = useRef<FormikProps<any>>(null);
  const identifiersSectionRef = useRef<FormikProps<any>>(null);

  const { actionType, setActionType } = useActionTypeToggle(
    fetchedActionDefinition?.actionType ?? "ADD",
    [
      collectingEvtFormRef,
      preparationsAndAttachmentsFormRef,
      identifiersSectionRef
    ]
  );

  const { attachedMetadatasUI: materialSampleAttachmentsUI } =
    useAttachmentsModal({
      initialMetadatas: [],
      deps: [],
      title: <DinaMessage id="materialSampleAttachments" />,
      isTemplate: true,
      allowNewFieldName: "attachmentsConfig.allowNew",
      allowExistingFieldName: "attachmentsConfig.allowExisting"
    });

  const { formTemplates, ...initialDefinition } = fetchedActionDefinition ?? {};

  const initialValues: Partial<WorkflowFormValues> = initialDefinition ?? {};

  // Initialize the tempalte form default values and checkbox states:
  const colEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(
      formTemplates?.COLLECTING_EVENT
    );
  if (!colEventTemplateInitialValues.geoReferenceAssertions?.length) {
    colEventTemplateInitialValues.geoReferenceAssertions = [{}];
  }

  // Split the material sample form template into Identifiers and Preparations:

  const identifiersTemplate = {
    templateFields: pick(
      formTemplates?.MATERIAL_SAMPLE?.templateFields,
      "materialSampleName",
      "dwcCatalogNumber",
      "dwcOtherCatalogNumbers"
    )
  };

  const preparationsTemplate = {
    allowNew: formTemplates?.MATERIAL_SAMPLE?.allowNew,
    allowExisting: formTemplates?.MATERIAL_SAMPLE?.allowExisting,
    templateFields: pick(
      formTemplates?.MATERIAL_SAMPLE?.templateFields,
      "preparationType",
      "preparedBy",
      "datePrepared"
    )
  };

  const preparationsTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(preparationsTemplate);
  const identifiersTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(identifiersTemplate);

  const materialSampleSaveHook = useMaterialSampleSave({
    isTemplate: true,
    colEventTemplateInitialValues,
    preparationsTemplateInitialValues,
    collectingEvtFormRef
  });

  const {
    colEventId: attachedColEventId,
    enableCollectingEvent,
    enablePreparations
  } = materialSampleSaveHook;

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues: mainTemplateFields
  }: DinaFormSubmitParams<WorkflowFormValues>) {
    // Construct the template definition to persist based on the form values:
    const definition: PreparationProcessDefinition = {
      ...mainTemplateFields,
      actionType,
      formTemplates:
        actionType === "ADD"
          ? {
              MATERIAL_SAMPLE: {
                ...preparationsAndAttachmentsFormRef.current?.values
                  .attachmentsConfig,
                templateFields: {
                  ...(identifiersSectionRef.current &&
                    getEnabledTemplateFieldsFromForm(
                      identifiersSectionRef.current.values
                    )),
                  ...(enablePreparations &&
                  preparationsAndAttachmentsFormRef.current
                    ? getEnabledTemplateFieldsFromForm(
                        preparationsAndAttachmentsFormRef.current.values
                      )
                    : undefined)
                }
              },
              COLLECTING_EVENT: enableCollectingEvent
                ? attachedColEventId
                  ? {
                      // When linking the template to an existing Col event, only set the ID here:
                      templateFields: {
                        id: { enabled: true, defaultValue: attachedColEventId }
                      }
                    }
                  : {
                      // When making a template for a new Collecting Event, set all chosen fields here:
                      ...collectingEvtFormRef.current?.values
                        ?.attachmentsConfig,
                      templateFields: {
                        ...getEnabledTemplateFieldsFromForm(
                          collectingEvtFormRef.current?.values
                        ),
                        id: undefined
                      }
                    }
                : undefined
            }
          : actionType === "SPLIT"
          ? {
              MATERIAL_SAMPLE: {
                ...preparationsAndAttachmentsFormRef.current?.values
                  .attachmentsConfig,
                templateFields: preparationsAndAttachmentsFormRef.current
                  ? getEnabledTemplateFieldsFromForm(
                      preparationsAndAttachmentsFormRef.current.values
                    )
                  : undefined
              }
            }
          : {},
      type: "material-sample-action-definition"
    };

    const [savedDefinition] = await save<PreparationProcessDefinition>(
      [
        {
          resource: definition,
          type: "material-sample-action-definition"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedDefinition);
  }

  const buttonBar = (
    <ButtonBar>
      <SubmitButton />
    </ButtonBar>
  );

  return (
    <DinaForm<Partial<WorkflowFormValues>>
      initialValues={initialValues}
      onSubmit={onSaveTemplateSubmit}
      validationSchema={workflowMainFieldsSchema}
    >
      {buttonBar}
      <div className="container">
        <FieldSet
          className="workflow-main-details"
          legend={<DinaMessage id="configureAction" />}
        >
          <div className="row">
            <div className="col-md-6">
              <TextField name="name" className="row" />
              <GroupSelectField name="group" enableStoredDefaultGroup={true} />
            </div>
            <div className="col-md-6">
              <label className="mx-3">
                <input
                  className="actionType-ADD"
                  type="radio"
                  checked={actionType === "ADD"}
                  onChange={() => setActionType("ADD")}
                />
                <p>{formatMessage("creatNewWorkflow")}</p>
              </label>
              <label className="mx-3">
                <input
                  className="actionType-SPLIT"
                  type="radio"
                  checked={actionType === "SPLIT"}
                  onChange={() => setActionType("SPLIT")}
                />
                <p>{formatMessage("createSplitWorkflow")}</p>
              </label>
            </div>
          </div>
        </FieldSet>
      </div>
      {actionType === "ADD" ? (
        <DinaFormSection isTemplate={true}>
          <MaterialSampleForm
            preparationsTemplateInitialValues={
              preparationsTemplateInitialValues
            }
            identifiersTemplateInitialValues={identifiersTemplateInitialValues}
            materialSampleSaveHook={materialSampleSaveHook}
            preparationsSectionRef={preparationsAndAttachmentsFormRef}
            identifiersSectionRef={identifiersSectionRef}
          />
        </DinaFormSection>
      ) : actionType === "SPLIT" ? (
        <DinaForm
          innerRef={preparationsAndAttachmentsFormRef}
          initialValues={preparationsTemplateInitialValues}
          isTemplate={true}
        >
          <PreparationsFormLayout />
          {materialSampleAttachmentsUI}
        </DinaForm>
      ) : null}
      {buttonBar}
    </DinaForm>
  );
}

export function useActionTypeToggle(
  initialValue: PreparationProcessDefinition["actionType"],
  templateFormRefs: RefObject<FormikProps<any>>[]
) {
  const { openModal } = useModal();
  const { formatMessage } = useDinaIntl();
  const [actionType, setActionTypeInner] = useState(initialValue ?? "ADD");

  /** Prompt the user before removing their form template. */
  function setActionType(newValue: PreparationProcessDefinition["actionType"]) {
    const aTemplateIsDefined = Boolean(
      templateFormRefs.filter(
        ref => !isEmpty(ref.current?.values.templateCheckboxes)
      ).length
    );

    // Only prompt if a template is already defined:
    if (aTemplateIsDefined) {
      openModal(
        <AreYouSureModal
          actionMessage={
            <DinaMessage
              id="switchToActionType"
              values={{
                actionType:
                  newValue === "ADD"
                    ? formatMessage("creatNewWorkflow")
                    : newValue === "SPLIT"
                    ? formatMessage("createSplitWorkflow")
                    : newValue
              }}
            />
          }
          messageBody={
            <DinaMessage
              id="thisWillRemoveYourTemplate"
              values={{ actionType: newValue }}
            />
          }
          onYesButtonClicked={() => setActionTypeInner(newValue)}
        />
      );
    } else {
      setActionTypeInner(newValue);
    }
  }

  return { actionType, setActionType };
}

/** Get the enabled template fields with their default values from the form. */
export function getEnabledTemplateFieldsFromForm(
  formValues: any
): TemplateFields {
  return mapValues(
    formValues.templateCheckboxes ?? {},
    (val: boolean | undefined, key) =>
      val
        ? {
            enabled: true,
            defaultValue: get(formValues, key) || undefined
          }
        : undefined
  );
}

/** Get the checkbox values for the template form from the persisted form template. */
export function getTemplateInitialValuesFromSavedFormTemplate<T>(
  formTemplate?: Partial<FormTemplate<T>>
): Partial<T> & { templateCheckboxes?: Record<string, true | undefined> } {
  if (!formTemplate) {
    return {};
  }

  // Get the checkbox state:
  const templateCheckboxes = mapValues(formTemplate.templateFields, val =>
    val?.enabled ? true : undefined
  );

  // Get the default values from the stored template:
  const defaultValues: Partial<T> = {};
  for (const [field, templateField] of toPairs<TemplateField<any> | undefined>(
    formTemplate.templateFields
  )) {
    if (templateField?.enabled && templateField.defaultValue) {
      set(defaultValues, field, templateField.defaultValue);
    }
  }

  const { allowNew, allowExisting } = formTemplate;
  return {
    ...defaultValues,
    templateCheckboxes,
    attachmentsConfig: { allowNew, allowExisting }
  };
}
