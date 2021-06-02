import {
  ButtonBar,
  DinaForm,
  DinaFormSubmitParams,
  FieldSet,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { PersistedResource } from "kitsu";
import { cloneDeep, get, mapValues } from "lodash";
import { useRouter, NextRouter } from "next/router";
import React, { useRef, useState } from "react";
import * as yup from "yup";
import { GroupSelectField, Head, Nav } from "../../../components";
import { useAttachmentsModal } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  PreparationProcessDefinition,
  TemplateFields
} from "../../../types/collection-api";
import {
  MaterialSampleForm,
  PreparationsFormLayout
} from "../material-sample/edit";

const workflowMainFieldsSchema = yup.object({
  name: yup.string().trim().required(),
  description: yup.string(),
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

  const initialValues: Partial<WorkflowFormValues> = {};

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues: mainTemplateFields
  }: DinaFormSubmitParams<WorkflowFormValues>) {
    if (!materialSampleFormRef.current || !collectingEvtFormRef.current) {
      return;
    }

    const materialSampleFormValues = cloneDeep(
      materialSampleFormRef.current.values
    );
    const collectingEventSectionValues = cloneDeep(
      collectingEvtFormRef.current.values
    );

    const materialSampleEnabledFields = getEnabledTemplateFieldsFromForm(
      materialSampleFormValues
    );
    const collectingEventEnabledFields = getEnabledTemplateFieldsFromForm(
      collectingEventSectionValues
    );

    const definition: PreparationProcessDefinition = {
      ...mainTemplateFields,
      actionType,
      formTemplates: {
        MATERIAL_SAMPLE: {
          ...materialSampleFormValues.attachmentsConfig,
          templateFields: materialSampleEnabledFields
        },
        COLLECTING_EVENT: {
          ...collectingEventSectionValues.attachmentsConfig,
          templateFields: collectingEventEnabledFields
        }
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
              <TextField name="description" className="row" />
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
      {actionType === "ADD" && (
        <MaterialSampleForm
          isTemplate={true}
          collectingEvtFormRef={collectingEvtFormRef}
          catelogueSectionRef={materialSampleFormRef}
        />
      )}
      {actionType === "SPLIT" && (
        <DinaForm
          initialValues={{}}
          innerRef={materialSampleFormRef}
          isTemplate={true}
        >
          <PreparationsFormLayout />
          {materialSampleAttachmentsUI}
        </DinaForm>
      )}
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
