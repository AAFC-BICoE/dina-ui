import {
  CatalogueInfoFormLayout,
  MaterialSampleForm
} from "../material-sample/edit";
import { FieldSet, TextField } from "../../../../common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useLocalStorage } from "@rehooks/local-storage";

import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { FormikProps, Field } from "formik";
import { useState, useRef } from "react";
import { Head, Nav } from "../../../components";
import { ButtonBar, SubmitButton, DinaForm } from "../../../../common-ui";
import React from "react";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useAttachmentsModal } from "packages/dina-ui/components/object-store";

/** A named set of templates used for editing workflow/preparation process. */
export interface WorkflowTemplate {
  name: string;
  description?: string;
  type: string;
  values?: Partial<MaterialSample>;
}

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();

  const [workflowType, setWorkflowType] = useState("createNew");

  const [storedWorkflowTemplates, saveWorkflowTemplates] = useLocalStorage<
    WorkflowTemplate[]
  >("workflow_templates", []);

  const {
    attachedMetadatasUI: materialSampleAttachmentsUI
  } = useAttachmentsModal({
    initialMetadatas: [],
    deps: [],
    title: <DinaMessage id="materialSampleAttachments" />,
    isTemplate: true,
    allowNewFieldName: "materialSampleAllowNew",
    allowExistingFieldName: "materialSampleAllowExisting"
  });

  const workFlowTypeOnChange = (e, form) => {
    form.setFieldValue("workFlowType", e.target.value);
    setWorkflowType(e.target.value);
  };

  const materialSampleFormRef = useRef<FormikProps<any>>(null);

  const catelogueSectionRef = React.createRef<FormikProps<any>>();

  const onSaveTemplateSubmit = values => {
    if (!values.submittedValues.templateName) {
      throw new Error(formatMessage("templateNameMandatoryErrorMsg"));
    }
    const workflow: WorkflowTemplate = {
      name: values.submittedValues.templateName,
      type: values.submittedValues.workFlowType
    };
    workflow.description = values.submittedValues.description;
    values.submittedValues.workFlowType === "createSplit"
      ? (workflow.values = catelogueSectionRef.current?.values)
      : (workflow.values = materialSampleFormRef.current?.values);
    const workflows = storedWorkflowTemplates;
    workflows.push(workflow);
    saveWorkflowTemplates(workflows);
  };

  const buttonBar = (
    <ButtonBar>
      <SubmitButton />
    </ButtonBar>
  );
  return (
    <div>
      <Head title={formatMessage("createWorkflowTemplateTitle")} />
      <Nav />
      <h1>
        <DinaMessage id="createWorkflowTemplateTitle" />
      </h1>
      <DinaForm
        initialValues={{ workFlowType: "createNew" }}
        onSubmit={onSaveTemplateSubmit}
      >
        <>
          {buttonBar}
          <FieldSet legend={<DinaMessage id="configureAction" />}>
            <div className="row">
              <div className="col-md-6">
                <TextField name="templateName" className="row" />
                <TextField name="templateDescription" className="row" />
              </div>
              <Field>
                {({ form }) => (
                  <div className="col-md-6 row">
                    <label className="col-md-2">
                      <input
                        className="form-control"
                        value="createNew"
                        type="radio"
                        name="workFlowType"
                        checked={workflowType === "createNew"}
                        onChange={e => workFlowTypeOnChange(e, form)}
                      />
                      {formatMessage("creatNewWorkflow")}
                    </label>
                    <label className="col-md-2">
                      <input
                        className="form-control"
                        value="createSplit"
                        type="radio"
                        name="workFlowType"
                        onChange={e => workFlowTypeOnChange(e, form)}
                      />
                      {formatMessage("createSplitWorkflow")}
                    </label>
                  </div>
                )}
              </Field>
            </div>
          </FieldSet>
          {workflowType === "createNew" && (
            <MaterialSampleForm
              isTemplate={true}
              materialSampleRef={materialSampleFormRef}
            />
          )}
          {workflowType === "createSplit" && (
            <DinaForm initialValues={{}} innerRef={catelogueSectionRef}>
              <CatalogueInfoFormLayout isTemplate={true} />
              {materialSampleAttachmentsUI}
            </DinaForm>
          )}
          {buttonBar}
        </>
      </DinaForm>
    </div>
  );
}
