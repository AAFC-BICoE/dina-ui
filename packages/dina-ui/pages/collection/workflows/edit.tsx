import { MaterialSampleForm } from "../material-sample/edit";
import { FieldSet, TextField } from "../../../../common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";

import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { FormikProps } from "formik";
import { useRef } from "react";
import { Head, Nav } from "../../../components";
import { ButtonBar, SubmitButton, DinaForm } from "../../../../common-ui";

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();

  const workflowType = useRef("createNew");
  const workFlowTypeOnChange = e => {
    workflowType.current = e.target.value;
  };

  const materialSampleFormRef = useRef<FormikProps<any>>(null);

  const onSaveTemplateSubmit = values => {
    if (!values.submittedValues.templateName) {
      throw new Error(formatMessage("templateNameMandatoryErrorMsg"));
    }
    // save template to local storage
    if (materialSampleFormRef.current) {
      const submittedMaterialSample = materialSampleFormRef.current.values;
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
        initialValues={{}}
        onSubmit={onSaveTemplateSubmit}
        enableReinitialize={true}
      >
        {buttonBar}
        <FieldSet legend={<DinaMessage id="configureAction" />}>
          <div className="row">
            <div className="col-md-6">
              <TextField name="templateName" className="row" />
              <TextField name="templateDescription" className="row" />
            </div>
            <div className="col-md-6 row">
              <label className="col-md-2">
                <input
                  value="createNew"
                  type="radio"
                  onChange={workFlowTypeOnChange}
                />
                {formatMessage("creatNewWorkflow")}
              </label>
              <label className="col-md-2">
                <input
                  value="createSplit"
                  type="radio"
                  onChange={workFlowTypeOnChange}
                />
                {formatMessage("createSplitWorkflow")}
              </label>
            </div>
          </div>
        </FieldSet>
        <MaterialSampleForm isTemplate={true} />
        {buttonBar}
      </DinaForm>
    </div>
  );
}
