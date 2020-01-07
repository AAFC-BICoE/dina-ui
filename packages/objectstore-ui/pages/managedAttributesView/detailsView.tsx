import {
  ApiClientContext,
  ErrorViewer,
  FieldWrapper,
  LabelWrapperParams,
  LoadingSpinner,
  Query,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Field, FieldProps, Form, Formik, FormikActions } from "formik";
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

interface AcceptedValueProps extends LabelWrapperParams {
  initialValues?: string[];
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
            <Query<ManagedAttribute>
              query={{
                path: `managed-attribute/${id}`
              }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ManagedAttributeForm
                      profile={response.data}
                      router={router}
                    />
                  )}
                </div>
              )}
            </Query>
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
  const { doOperations } = useContext(ApiClientContext);
  const [type, setType] = useState(
    profile ? profile.managedAttributeType : undefined
  );
  const initialValues = profile || { type: "managed-attribute" };

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    const managedAttributeValues = {
      acceptedValues: submittedValues.acceptedValues
        ? submittedValues.acceptedValues
        : null,
      managedAttributeType: submittedValues.managedAttributeType,
      name: submittedValues.name
    };

    try {
      if (profile) {
        const response = await doOperations([
          {
            op: "PATCH",
            path: `managed-attribute/${profile.id}`,
            value: {
              attributes: {
                acceptedValues: managedAttributeValues.acceptedValues,
                managedAttributeType:
                  managedAttributeValues.managedAttributeType,
                name: managedAttributeValues.name
              },
              type: "managed-attribute"
            }
          }
        ]);
        router.push(`/managedAttributesView/listView`);
      } else {
        // Single hard-coded value used a filler for ID until proper
        // UUID genereation is implemented
        const newId = "bd628e6c-e46d-4cd7-b272-75454d522d53";

        const response = await doOperations([
          {
            op: "POST",
            path: "managed-attribute",
            value: {
              attributes: {
                acceptedValues: managedAttributeValues.acceptedValues,
                managedAttributeType:
                  managedAttributeValues.managedAttributeType,
                name: managedAttributeValues.name
              },
              id: newId,
              type: "managed-attribute"
            }
          }
        ]);
        router.push(`/managedAttributesView/detailsView?id=${newId}`);
      }
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
          <TextField name="name" hideLabel={true} />
        </div>
        <div>
          <h4>
            <ObjectStoreMessage id="field_managedAttributeType" />
          </h4>
          <SelectField
            name="managedAttributeType"
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
            <AcceptedValueBuilder
              name="acceptedValues"
              initialValues={profile ? profile.acceptedValues : undefined}
              hideLabel={true}
            />
          </div>
        )}
      </Form>
    </Formik>
  );
}

/**
 * Renders a mutable list of user inputs
 */
function AcceptedValueBuilder({
  className,
  name,
  label,
  tooltipMsg,
  hideLabel,
  initialValues
}: AcceptedValueProps) {
  const [values, setValues] = useState(initialValues ? initialValues : []);
  const [input, setInput] = useState();

  async function onAndClick() {
    if (!values.includes(input) && input !== "") {
      const valueArray = [...values];
      valueArray.splice(valueArray.length, 0, input);
      setValues(valueArray);
      setInput("");
    }
  }

  return (
    <FieldWrapper
      className={className}
      name={name}
      label={label}
      tooltipMsg={tooltipMsg}
      hideLabel={hideLabel}
    >
      <div>
        <Field name={name}>
          {({ form: { setFieldValue, setFieldTouched } }: FieldProps) => {
            function onAndClickInternal() {
              onAndClick();
              setFieldValue(name, [...values, input]);
              setFieldTouched(name);
            }
            function onRemoveClick(index) {
              if (values.length === 1) {
                setValues([]);
                setFieldValue(name, undefined);
                setFieldTouched(name);
              } else {
                const newValues = [...values];
                newValues.splice(index, 1);
                setValues(newValues);
                setFieldValue(name, [newValues]);
                setFieldTouched(name);
              }
            }

            // The Accepted Values text input needs to be replaced with our own
            // controlled input that we manually pass the "onChange" and "value" props. Otherwise
            // we will get React's warning about switching from an uncontrolled to controlled input.
            return (
              <div>
                <input
                  className="list-inline-item"
                  name="addValue"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button
                  className="list-inline-item btn btn-primary"
                  onClick={onAndClickInternal}
                  type="button"
                >
                  +
                </button>
                {values &&
                  values.map((value, index) => {
                    return (
                      <div key={index}>
                        <input
                          className="list-inline-item"
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
              </div>
            );
          }}
        </Field>
      </div>
    </FieldWrapper>
  );
}

export default withRouter(ManagedAttributesDetailsPage);
