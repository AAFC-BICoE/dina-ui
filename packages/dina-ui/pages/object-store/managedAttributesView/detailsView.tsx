// tslint:disable: no-string-literal
import {
  ApiClientContext,
  ButtonBar,
  DateField,
  DeleteButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { NextRouter, withRouter } from "next/router";
import { useContext, useState } from "react";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api/resources/ManagedAttribute";

interface ManagedAttributeFormFields extends ManagedAttribute {
  acceptedValuesAsLines?: string;
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
      <main className="container-fluid">
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
      </main>
      <Footer />
    </div>
  );
}

function ManagedAttributeForm({ profile, router }: ManagedAttributeFormProps) {
  const { save } = useContext(ApiClientContext);
  const [type, setType] = useState(
    profile ? profile.managedAttributeType : undefined
  );
  const id = profile?.id;

  const initialValues: Partial<ManagedAttributeFormFields> = profile || {
    type: "managed-attribute"
  };
  // Convert acceptedValues to easily editable string format:
  initialValues.acceptedValuesAsLines =
    initialValues.acceptedValues?.concat("")?.join("\n") ?? "";

  const { formatMessage } = useDinaIntl();

  async function onSubmit({
    acceptedValuesAsLines,
    ...managedAttribute
  }: ManagedAttributeFormFields) {
    if (
      managedAttribute.name === undefined ||
      managedAttribute.managedAttributeType === undefined
    ) {
      throw new Error(
        formatMessage("field_managedAttributeMandatoryFieldsError")
      );
    }

    // Convert user-suplied string to string array:
    managedAttribute.acceptedValues = (acceptedValuesAsLines || "")
      // Split by line breaks:
      .match(/[^\r\n]+/g)
      // Remove empty lines:
      ?.filter(line => line.trim());

    // Treat empty array or undefined as null:
    if (!managedAttribute.acceptedValues?.length) {
      managedAttribute.acceptedValues = null;
    }

    await save(
      [
        {
          resource: managedAttribute,
          type: "managed-attribute"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
    router.push(`/object-store/managedAttributesView/listView`);
  }

  return (
    <Formik initialValues={initialValues} onSubmit={safeSubmit(onSubmit)}>
      <Form translate={undefined}>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <Link href="/object-store/managedAttributesView/listView">
            <a className="btn btn-dark">
              <DinaMessage id="cancelButtonText" />
            </a>
          </Link>
          <DeleteButton
            className="ml-5"
            id={id}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/managedAttributesView/listView"
            type="managed-attribute"
          />
        </ButtonBar>
        <div style={{ width: "300px" }}>
          <TextField name="name" />
        </div>
        <div style={{ width: "70%" }}>
          <TextField name="description.en" multiLines={true} />
        </div>
        <div style={{ width: "70%" }}>
          <TextField name="description.fr" multiLines={true} />
        </div>
        <div style={{ width: "300px" }}>
          <SelectField
            name="managedAttributeType"
            options={ATTRIBUTE_TYPE_OPTIONS}
            onChange={selectValue => setType(selectValue)}
          />
        </div>
        {type === "STRING" && (
          <div style={{ width: "300px" }}>
            <TextField name="acceptedValuesAsLines" multiLines={true} />
          </div>
        )}
        {id && (
          <div style={{ width: "300px" }}>
            <h4>
              <DinaMessage id="field_managedAttributeCreatedOn" />
            </h4>
            <DateField
              showTime={true}
              name="createdOn"
              disabled={true}
              hideLabel={true}
            />
          </div>
        )}
        {id && (
          <div style={{ width: "300px" }}>
            <h4>
              <DinaMessage id="field_managedAttributeCreatedBy" />
            </h4>
            <TextField name="createdBy" hideLabel={true} readOnly={true} />
          </div>
        )}
      </Form>
    </Formik>
  );
}

export default withRouter(ManagedAttributesDetailsPage);
