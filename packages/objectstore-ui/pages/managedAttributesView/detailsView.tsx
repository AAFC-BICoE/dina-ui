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
import { ObjectStoreMessage } from "../../intl/objectstore-intl";
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
            <h1>
              <ObjectStoreMessage id="managedAttributesEditTitle" />
            </h1>
            <ManagedAttributeForm router={router} />
          </div>
        ) : (
          <div>
            <h1>
              <ObjectStoreMessage id="addManagedAttributeButtonText" />
            </h1>
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
  const [type, setType] = useState();
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
            <ObjectStoreMessage id="cancelButtonText" />
          </button>
        </a>
        <div>
          <h4>
            <ObjectStoreMessage id="field_managedAttributeName" />
          </h4>
          <TextField name="attributeName" hideLabel={true} />
        </div>
        <div>
          <h4>
            <ObjectStoreMessage id="field_managedAttributeType" />
          </h4>
          <SelectField
            name="attributeType"
            options={ATTRIBUTE_TYPE_OPTIONS}
            onChange={selectValue => setType(selectValue)}
            hideLabel={true}
          />
        </div>
        {type === "STRING" && (
          <div>
            <h4>
              <ObjectStoreMessage id="field_managedAttributeAcceptedValue" />
            </h4>
            <AcceptedValueBuilder />
          </div>
        )}
      </Form>
    </Formik>
  );
}

/**
 * Renders a mutable list of user inputs
 */
function AcceptedValueBuilder() {
  const [values, setValues] = useState([]);
  const [input, setInput] = useState();

  async function onAndClick() {
    if (!values.includes(input) && input !== "") {
      const valueArray = [...values];
      valueArray.splice(valueArray.length, 0, input);
      setValues(valueArray);
      setInput("");
    }
  }

  async function onRemoveClick(index) {
    if (values.length === 1) {
      setValues([]);
    } else {
      const newValues = [...values];
      newValues.splice(index, 1);
      setValues(newValues);
    }
  }

  return (
    <div key="acceptedValues">
      {values &&
        values.map((value, index) => {
          return (
            <div key={index}>
              <input
                type="text"
                name={`acceptedValue_${index}`}
                value={value}
                readOnly={true}
              />
              <button
                className="list-inline-item btn btn-dark"
                onClick={() => onRemoveClick(index)}
                type="button"
              >
                -
              </button>
            </div>
          );
        })}
      <input
        className="list-inline-item"
        name="addValue"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
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
