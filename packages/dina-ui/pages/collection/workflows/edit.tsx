import { DinaForm } from "../../../../common-ui/lib";
import { MaterialSampleForm } from "../material-sample/edit";
import { FieldSet, TextField } from "../../../../common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";

import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { FormikProps } from "formik";
import { useRef } from "react";
import { Head, Nav } from "../../../components";

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();

  const workFlowTypeOnChange = e => {
    // console.log("e.target " + e);
  };

  // save template to local storage
  const saveTemplate = () => {
    if (materialSampleFormRef.current) {
      const submittedMaterialSample = materialSampleFormRef.current.values;
    }
  };

  const materialSampleFormRef = useRef<FormikProps<any>>(null);

  return (
    <div>
      <Head title={formatMessage("createWorkflowTemplateTitle")} />
      <Nav />
      <main className="container">
        <DinaForm initialValues={{}} innerRef={materialSampleFormRef}>
          <FieldSet legend={<DinaMessage id="configureAction" />}>
            <div className="row">
              <div className="col-md-6">
                <TextField name="templateName" className="row" />
                <TextField name="templateDescription" className="row" />
              </div>
              <div className="col-md-6">
                <label>
                  <input
                    value="createNew"
                    type="radio"
                    onChange={workFlowTypeOnChange}
                  />
                  {formatMessage("creatNewWorkflow")}
                </label>
                <label>
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
        </DinaForm>
      </main>
    </div>
  );
}
