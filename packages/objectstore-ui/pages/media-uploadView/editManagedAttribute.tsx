import { SubmitButton } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import withRouter, { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter } from "next/router";
import React from "react";
import { Head } from "../../components";
import { AttributeBuilder } from "../../components/attribute-builder/AttributeBuilder";

interface ManagedAttributeFormProps {
  router: NextRouter;
}

const managedAttributes = [
  "Please select a managed attribute to set its value for"
];

function EditManagedAttribute({ router }: WithRouterProps) {
  return (
    <div>
      <Head title="Edit Managed Attributes" />
      <div className="container-fluid">
        <div>
          <h1>Edit Managed Attributes</h1>
          <ManagedAttributeForm router={router} />
        </div>
      </div>
    </div>
  );
}

function ManagedAttributeForm({  }: ManagedAttributeFormProps) {
  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      // router.push(`/media-uploadView/uploadFile`);
    } catch (error) {
      setStatus(
        error.message + ", " + " submittedValues are: " + submittedValues
      );
    }
    setSubmitting(false);
  }

  return (
    <Formik initialValues={{}} onSubmit={onSubmit}>
      <Form>
        <div>
          <AttributeBuilder controlledAttributes={managedAttributes} />
          <div className="container">
            <div className="row">
              <div className="col-sm-1">
                <SubmitButton />
              </div>
            </div>
          </div>
        </div>
      </Form>
    </Formik>
  );
}

export default withRouter(EditManagedAttribute);
