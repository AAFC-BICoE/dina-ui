import {
  CatalogueInfoFormLayout,
  MaterialSampleForm,
  MaterialSampleFormLayout
} from "../material-sample/edit";
import { DinaFormSection, FieldSet, TextField } from "../../../../common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";

import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { FormikProps, Field } from "formik";
import { useRef, useState } from "react";
import { Head, Nav } from "../../../components";
import { ButtonBar, SubmitButton, DinaForm } from "../../../../common-ui";
import React from "react";

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();

  const [workflowType, setWorkflowType] = useState("createNew");
  const workFlowTypeOnChange = (e, form) => {
    form.setFieldValue("workFlowType", e.target.value);
    setWorkflowType(e.target.value);
  };

  const materialSampleFormRef = useRef<FormikProps<any>>(null);

  const onSaveTemplateSubmit = values => {
    if (!values.submittedValues.templateName) {
      throw new Error(formatMessage("templateNameMandatoryErrorMsg"));
    }
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
            <MaterialSampleForm isTemplate={true} />
          )}
          {workflowType === "createSplit" && (
            <DinaForm initialValues={{}} isTemplate={true}>
              <CatalogueInfoFormLayout />
            </DinaForm>
          )}
          {buttonBar}
        </>
      </DinaForm>
    </div>
  );
}
