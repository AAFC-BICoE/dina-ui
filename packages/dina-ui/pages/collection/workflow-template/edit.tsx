import {
  ButtonBar,
  DinaForm,
  DinaFormSection,
  DinaFormSubmitParams,
  FieldSet,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { PersistedResource } from "kitsu";
import { get, mapValues, set, toPairs } from "lodash";
import { NextRouter, useRouter } from "next/router";
import React, { useRef, useState } from "react";
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
              router={router}
            />
          ))
        ) : (
          <WorkflowTemplateForm router={router} />
        )}
      </div>
    </div>
  );
}

export interface WorkflowTemplateFormProps {
  fetchedActionDefinition?: PersistedResource<PreparationProcessDefinition>;
  router: NextRouter;
}

export function WorkflowTemplateForm({
  fetchedActionDefinition,
  router
}: WorkflowTemplateFormProps) {
  const { formatMessage } = useDinaIntl();

  const [actionType, setActionType] = useState<
    PreparationProcessDefinition["actionType"]
  >(fetchedActionDefinition?.actionType ?? "ADD");

  const { attachedMetadatasUI: materialSampleAttachmentsUI } =
    useAttachmentsModal({
      initialMetadatas: [],
      deps: [],
      title: <DinaMessage id="materialSampleAttachments" />,
      isTemplate: true,
      allowNewFieldName: "formTemplates.MATERIAL_SAMPLE.allowNew",
      allowExistingFieldName: "formTemplates.MATERIAL_SAMPLE.allowExisting"
    });

  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const materialSampleFormRef = useRef<FormikProps<any>>(null);

  const { formTemplates, ...initialDefinition } = fetchedActionDefinition ?? {};

  const initialValues: Partial<WorkflowFormValues> = initialDefinition ?? {};

  // Initialize the tempalte form default values and checkbox states:
  const colEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(
      formTemplates?.COLLECTING_EVENT
    );
  const materialSampleTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(
      formTemplates?.MATERIAL_SAMPLE
    );

  const materialSampleSaveHook = useMaterialSampleSave({
    isTemplate: true,
    colEventTemplateInitialValues,
    materialSampleTemplateInitialValues,
    collectingEvtFormRef
  });

  const { enableCollectingEvent, enablePreparations } = materialSampleSaveHook;

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues: mainTemplateFields
  }: DinaFormSubmitParams<WorkflowFormValues>) {
    // Construct the template definition to persist based on the form values:
    const definition: PreparationProcessDefinition = {
      ...mainTemplateFields,
      actionType,
      formTemplates: {
        MATERIAL_SAMPLE: {
          ...materialSampleFormRef.current?.values.attachmentsConfig,
          templateFields:
            enablePreparations && materialSampleFormRef.current
              ? getEnabledTemplateFieldsFromForm(
                  materialSampleFormRef.current.values
                )
              : undefined
        },
        COLLECTING_EVENT:
          enableCollectingEvent && collectingEvtFormRef.current
            ? {
                ...collectingEvtFormRef.current.values.attachmentsConfig,
                templateFields: getEnabledTemplateFieldsFromForm(
                  collectingEvtFormRef.current.values
                )
              }
            : undefined
      },
      type: "material-sample-action-definition"
    };

    await save(
      [
        {
          resource: definition,
          type: "material-sample-action-definition"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await router.push("/collection/workflow-template/list");
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
        <FieldSet legend={<DinaMessage id="configureAction" />}>
          <div className="row">
            <div className="col-md-6">
              <TextField name="name" className="row" />
              <GroupSelectField name="group" enableStoredDefaultGroup={true} />
            </div>
            <div className="col-md-6">
              <label className="mx-3">
                <input
                  type="radio"
                  checked={actionType === "ADD"}
                  onChange={() => setActionType("ADD")}
                />
                <p>{formatMessage("creatNewWorkflow")}</p>
              </label>
              <label className="mx-3">
                <input
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
            materialSampleTemplateInitialValues={
              materialSampleTemplateInitialValues
            }
            materialSampleSaveHook={materialSampleSaveHook}
            catelogueSectionRef={materialSampleFormRef}
          />
        </DinaFormSection>
      ) : actionType === "SPLIT" ? (
        <DinaForm
          initialValues={{}}
          innerRef={materialSampleFormRef}
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
  formTemplate?: FormTemplate<T>
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
