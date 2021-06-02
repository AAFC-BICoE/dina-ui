import {
  ButtonBar,
  DinaForm,
  DinaFormSubmitParams,
  FieldSet,
  SubmitButton,
  TextField
} from "common-ui";
import { FormikProps } from "formik";
import React, { useRef, useState } from "react";
import * as yup from "yup";
import { GroupSelectField, Head, Nav } from "../../../components";
import { useAttachmentsModal } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { PreparationProcessDefinition } from "../../../types/collection-api";
import {
  MaterialSampleForm,
  PreparationsFormLayout
} from "../material-sample/edit";

// const formTemplateSchema = yup.object({
//   allowNew: yup.boolean().required(),
//   allowExisting: yup.boolean().required(),
//   templateFields: yup.mixed()
// });

const workflowFormSchema = yup.object({
  name: yup.string().trim().required(),
  description: yup.string(),
  group: yup.string().required()
  // formTemplates: yup.object({
  //   COLLECTING_EVENT: formTemplateSchema,
  //   MATERIAL_SAMPLE: formTemplateSchema
  // })
});

type WorkflowFormValues = yup.InferType<typeof workflowFormSchema>;

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();

  const [workflowType, setWorkflowType] =
    useState<"CREATE_NEW" | "SPLIT">("CREATE_NEW");

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

  const catalogueSectionRef = useRef<FormikProps<any>>(null);

  async function onSaveTemplateSubmit({
    submittedValues: mainTemplateFormValues
  }: DinaFormSubmitParams<WorkflowFormValues>) {
    if (!catalogueSectionRef.current) {
      return;
    }

    const { attachmentsConfig } = catalogueSectionRef.current.values;

    const definition: PreparationProcessDefinition = {
      ...mainTemplateFormValues,
      formTemplates: {
        MATERIAL_SAMPLE: {
          ...attachmentsConfig
        }
      },
      type: "material-sample-action-definition"
    };

    // console.log({
    //   mainTemplateFormValues,
    //   collectingEvtFormRef,
    //   catalogueSectionRef,
    //   definition
    // });
  }

  const initialValues: Partial<WorkflowFormValues> = {};

  const buttonBar = (
    <ButtonBar>
      <SubmitButton />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("createWorkflowTemplateTitle")} />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id="createWorkflowTemplateTitle" />
        </h1>
        <DinaForm<Partial<WorkflowFormValues>>
          initialValues={initialValues}
          onSubmit={onSaveTemplateSubmit}
          validationSchema={workflowFormSchema}
        >
          {buttonBar}
          <div className="container">
            <FieldSet legend={<DinaMessage id="configureAction" />}>
              <div className="row">
                <div className="col-md-6">
                  <TextField name="name" className="row" />
                  <TextField name="description" className="row" />
                  <GroupSelectField
                    name="group"
                    enableStoredDefaultGroup={true}
                  />
                </div>
                <div className="col-md-6">
                  <label className="mx-3">
                    <input
                      type="radio"
                      checked={workflowType === "CREATE_NEW"}
                      onChange={() => setWorkflowType("CREATE_NEW")}
                    />
                    <p>{formatMessage("creatNewWorkflow")}</p>
                  </label>
                  <label className="mx-3">
                    <input
                      type="radio"
                      checked={workflowType === "SPLIT"}
                      onChange={() => setWorkflowType("SPLIT")}
                    />
                    <p>{formatMessage("createSplitWorkflow")}</p>
                  </label>
                </div>
              </div>
            </FieldSet>
          </div>
          {workflowType === "CREATE_NEW" && (
            <MaterialSampleForm
              isTemplate={true}
              collectingEvtFormRef={collectingEvtFormRef}
              catelogueSectionRef={catalogueSectionRef}
              attachmentsAllowNewFieldName="attachmentsConfig.allowNew"
              attachmentsAllowExistingFieldName="attachmentsConfig.allowExisting"
            />
          )}
          {workflowType === "SPLIT" && (
            <DinaForm
              initialValues={{}}
              innerRef={catalogueSectionRef}
              isTemplate={true}
            >
              <PreparationsFormLayout />
              {materialSampleAttachmentsUI}
            </DinaForm>
          )}
          {buttonBar}
        </DinaForm>
      </div>
    </div>
  );
}
