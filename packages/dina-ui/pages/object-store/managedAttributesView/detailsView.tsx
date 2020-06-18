import {
  ApiClientContext,
  DeleteButton,
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
import Link from "next/link";
import { NextRouter, withRouter } from "next/router";
import { useContext, useState } from "react";
import { Head, Nav } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api/resources/ManagedAttribute";

interface AcceptedValueProps extends LabelWrapperParams {
  initialValues?: string[];
}

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
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="managedAttributeEditTitle" />
            </h1>
            <Query<ManagedAttribute>
              query={{
                path: `objectstore-api/managed-attribute/${id}`
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
              <DinaMessage id="addManagedAttributeButtonText" />
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
  const [type, setType] = useState(
    profile ? profile.managedAttributeType : undefined
  );

  const initialValues = profile || { type: "managed-attribute" };

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    const isTypeInteger = submittedValues.managedAttributeType === "INTEGER";
    const managedAttributeValues = {
      acceptedValues:
        submittedValues.acceptedValues && !isTypeInteger
          ? submittedValues.acceptedValues
          : null,
      id: submittedValues.id ? submittedValues.id : null,
      managedAttributeType: submittedValues.managedAttributeType,
      name: submittedValues.name,
      type: submittedValues.type
    };
    try {
      await save(
        [
          {
            resource: managedAttributeValues,
            type: "managed-attribute"
          }
        ],
        { apiBaseUrl: "/objectstore-api" }
      );
      router.push(`/object-store/managedAttributesView/listView`);
      setSubmitting(false);
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
        <DeleteButton
          id={profile?.id}
          options={{ apiBaseUrl: "/objectstore-api" }}
          postDeleteRedirect="/object-store/managedAttributesView/listView"
          type="managed-attribute"
        />
        <Link href="/object-store/managedAttributesView/listView">
          <a className="btn btn-primary">
            <DinaMessage id="cancelButtonText" />
          </a>
        </Link>
        <div style={{ width: "300px" }}>
          <h4>
            <DinaMessage id="field_managedAttributeName" />
          </h4>
          <TextField name="name" hideLabel={true} />
        </div>
        <div style={{ width: "300px" }}>
          <h4>
            <DinaMessage id="field_managedAttributeType" />
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
              <DinaMessage id="field_managedAttributeAcceptedValue" />
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
            function onAndClick() {
              values.push("");
              setFieldValue(name, [...values]);
              setFieldTouched(name);
            }
            function onChange(input, index) {
              const newValues = [...values];
              newValues.splice(index, 1, input);
              setValues(newValues);
              setFieldValue(name, newValues);
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
                setFieldValue(name, newValues);
                setFieldTouched(name);
              }
            }

            // The Accepted Values text input needs to be replaced with our own
            // controlled input that we manually pass the "onChange" and "value" props. Otherwise
            // we will get React's warning about switching from an uncontrolled to controlled input.
            return (
              <div>
                <button
                  className="list-inline-item btn btn-primary"
                  onClick={onAndClick}
                  type="button"
                >
                  Add New Accepted Value
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
                          onChange={e => onChange(e.target.value, index)}
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
