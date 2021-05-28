// tslint:disable: no-string-literal
import {
  ButtonBar,
  DateField,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  Query,
  SelectField,
  StringArrayField,
  SubmitButton,
  TextField
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { NextRouter, withRouter } from "next/router";
import { useState } from "react";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  ManagedAttributeType,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../../types/objectstore-api/resources/ManagedAttribute";

interface ManagedAttributeFormProps {
  profile?: ManagedAttribute;
  router: NextRouter;
}

export function ManagedAttributesDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Managed Attribute Details" />
      <Nav />
      <main className="container">
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
  const { formatMessage } = useDinaIntl();

  const id = profile?.id;

  const initialValues: Partial<ManagedAttribute> = profile || {
    type: "managed-attribute"
  };

  const acceptedValueLen = profile?.acceptedValues?.length;

  const [type, setType] = useState(
    profile
      ? acceptedValueLen
        ? "PICKLIST"
        : profile.managedAttributeType
      : undefined
  );

  if (type === "PICKLIST") {
    initialValues.managedAttributeType = "PICKLIST";
  }

  const ATTRIBUTE_TYPE_OPTIONS = MANAGED_ATTRIBUTE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const onSubmit: DinaFormOnSubmit<Partial<ManagedAttribute>> = async ({
    api: { save },
    submittedValues
  }) => {
    // Treat empty array or undefined as null:
    if (!submittedValues.acceptedValues?.length) {
      submittedValues.acceptedValues = null;
    }

    if (!submittedValues.name || !submittedValues.managedAttributeType) {
      throw new Error(
        formatMessage("field_managedAttributeMandatoryFieldsError")
      );
    }

    if (submittedValues.managedAttributeType === "PICKLIST") {
      submittedValues.managedAttributeType = "STRING";
    } else if (
      submittedValues.managedAttributeType === "INTEGER" ||
      submittedValues.managedAttributeType === "STRING"
    ) {
      submittedValues.acceptedValues = null;
    }

    await save(
      [
        {
          resource: { type: "managed-attribute", ...submittedValues },
          type: "managed-attribute"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`/object-store/managedAttributesView/listView`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <Link href="/object-store/managedAttributesView/listView">
          <a className="btn btn-dark">
            <DinaMessage id="cancelButtonText" />
          </a>
        </Link>
        <DeleteButton
          className="ms-5"
          id={id}
          options={{ apiBaseUrl: "/objectstore-api" }}
          postDeleteRedirect="/object-store/managedAttributesView/listView"
          type="managed-attribute"
        />
      </ButtonBar>
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          readOnly={id !== undefined}
        />
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
      <TextField name="description.en" multiLines={true} />
      <TextField name="description.fr" multiLines={true} />
      <div className="row">
        <SelectField
          className="col-md-6"
          name="managedAttributeType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: ManagedAttributeType) => setType(selectValue)}
        />
      </div>
      {type === "PICKLIST" && <StringArrayField name="acceptedValues" />}
      {id && <DateField showTime={true} name="createdOn" disabled={true} />}
      {id && <TextField name="createdBy" readOnly={true} />}
    </DinaForm>
  );
}

export default withRouter(ManagedAttributesDetailsPage);
