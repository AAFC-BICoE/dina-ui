import { Form, Formik, FormikActions } from "formik";
import { withRouter, WithRouterProps } from "next/router";
import {
  ErrorViewer,
  Head,
  Nav,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField
} from "../../components";
import { Group } from "../../types/seqdb-api/resources/Group";
import { filterBy } from "../../util/rsql";

const MOCK_TEMPLATE_OPTIONS = [
  {
    label: "Shotgun",
    value: "shotgun"
  }
];

function WorkflowEditPage({ router }: WithRouterProps) {
  function onSubmit(submittedValues, {  }: FormikActions<any>) {
    router.push("/workflow/view?id=1");
  }

  return (
    <div>
      <Head title="Edit PCR Primer" />
      <Nav />
      <div className="container-fluid">
        <h1>Edit Workflow</h1>
        <Formik initialValues={{}} onSubmit={onSubmit}>
          <Form>
            <ErrorViewer />
            <div className="row">
              <SelectField
                className="col-md-2"
                name="workflowTemplate"
                options={MOCK_TEMPLATE_OPTIONS}
              />
            </div>
            <div className="row">
              <ResourceSelectField<Group>
                className="col-md-2"
                name="group"
                filter={filterBy(["groupName"])}
                model="group"
                optionLabel={group => group.groupName}
              />
            </div>
            <div className="row">
              <TextField className="col-md-2" name="name" />
            </div>
            <SubmitButton />
          </Form>
        </Formik>
      </div>
    </div>
  );
}

export default withRouter(WorkflowEditPage);
