import {
  ApiClientContext,
  ErrorViewer,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext, useState } from "react";
import { Head, Nav } from "../../components";
import { ManagedAttribute } from "../../types/objectstore-api/resources/ManagedAttribute";

interface ManagedAttributeFormProps {
  profile?: ManagedAttribute;
  router: NextRouter;
}

const ATTRIBUTE_TYPE_OPTIONS = [
  {
    label: "Integer",
    value: "INTEGER"
  },
  {
    label: "String",
    value: "STRING"
  }
];

export function ManagedAttributesDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Managed Attribute Details" />
      <Nav />
      <div>
        {id ? (
          <div>
            <h1>Edit Managed Attribute</h1>
            <ManagedAttributeForm router={router} />
          </div>
        ) : (
          <div>
            <h1>Add Managed Attribute</h1>
            <br />
            <ManagedAttributeForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function ManagedAttributeForm({ profile, router }: ManagedAttributeFormProps) {
  const { save } = useContext(ApiClientContext);
  const initialValues = profile || { type: "managed-attribute" };

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    const managedAttributeValues = {
      acceptedValues: submittedValues[3] ? submittedValues[3] : null,
      name: submittedValues[1],
      type: submittedValues[2],
      uuid: "" // assign value returned from post op
    };

    try {
      const response = await save([
        {
          resource: managedAttributeValues,
          type: "managed-attribute"
        }
      ]);

      const newId = response[0].id;
      router.push(`/managedAttributesView/detailsView?id=${newId}`);
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <SubmitButton />
        <a href="/managedAttributesView/listView">
          <button className="btn btn-primary" type="button">
            Cancel
          </button>
        </a>
        <h4>Name</h4>
        <div>
          <TextField name="attributeName" label="Attribute Name" />
        </div>
        <br />
        <h4>Type</h4>
        <div>
          <SelectField
            name="attributeType"
            label="Attribute Type"
            options={ATTRIBUTE_TYPE_OPTIONS}
          />
        </div>
        <br />
        <h4>Accepted Values</h4>
        <div>
          <AcceptedValueBuilder />
        </div>
      </Form>
    </Formik>
  );
}

function AcceptedValueBuilder() {
  const [values, setValues] = useState(["top"]);

  async function onAndClick() {
    setValues(values);
  }

  async function onRemoveClick() {
    setValues(values);
  }

  return (
    <div>
      {values &&
        values.map((value, index) => {
          return (
            <div key={index}>
              <input
                type="text"
                name={`acceptedValue_${index}`}
                value={value}
              />
              <button
                className="list-inline-item btn btn-dark"
                onClick={onRemoveClick}
                type="button"
              >
                -
              </button>
            </div>
          );
        })}
      <TextField className="list-inline-item" name="acceptedValue" />
      <button
        className="list-inline-item btn btn-primary"
        onClick={onAndClick}
        type="button"
      >
        +
      </button>
    </div>
  );
}

export default withRouter(ManagedAttributesDetailsPage);
