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
  COLLECTION_MODULE_TYPES,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS,
  CollectionModuleType,
  COLLECTION_MODULE_TYPE_LABELS
} from "../../../types/collection-api/resources/ManagedAttribute";

interface ManagedAttributeFormFields extends ManagedAttribute {
  acceptedValuesAsLines?: string;
}

interface ManagedAttributeFormProps {
  fetchedManagedAttribute?: ManagedAttribute;
  router: NextRouter;
}

export function ManagedAttributesDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("managedAttributeEditTitle")} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="managedAttributeEditTitle" />
            </h1>
            <Query<ManagedAttribute>
              query={{ path: `collection-api/managed-attribute/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ManagedAttributeForm
                      fetchedManagedAttribute={response.data}
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

function ManagedAttributeForm({
  fetchedManagedAttribute,
  router
}: ManagedAttributeFormProps) {
  const { formatMessage } = useDinaIntl();

  const id = fetchedManagedAttribute?.id;

  const initialValues: Partial<ManagedAttributeFormFields> = fetchedManagedAttribute || {
    type: "managed-attribute"
  };

  const [type, setType] = useState(
    fetchedManagedAttribute
      ? fetchedManagedAttribute?.acceptedValues?.length
        ? "PICKLIST"
        : fetchedManagedAttribute.managedAttributeType
      : undefined
  );

  if (type === "PICKLIST") {
    initialValues.managedAttributeType = "PICKLIST";
  }

  // Convert acceptedValues to easily editable string format:
  initialValues.acceptedValuesAsLines =
    initialValues.acceptedValues?.concat("")?.join("\n") ?? "";

  const ATTRIBUTE_TYPE_OPTIONS = MANAGED_ATTRIBUTE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: CollectionModuleType;
  }[] = COLLECTION_MODULE_TYPES.map(dataType => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));

  const onSubmit: DinaFormOnSubmit<ManagedAttributeFormFields> = async ({
    api: { save },
    submittedValues: { acceptedValuesAsLines, ...submittedManagedAttribute }
  }) => {
    // Convert user-suplied string to string array:
    submittedManagedAttribute.acceptedValues = (acceptedValuesAsLines || "")
      // Split by line breaks:
      .match(/[^\r\n]+/g)
      // Remove empty lines:
      ?.filter(line => line.trim());

    // Treat empty array or undefined as null:
    if (!submittedManagedAttribute.acceptedValues?.length) {
      submittedManagedAttribute.acceptedValues = null;
    }

    if (submittedManagedAttribute.managedAttributeType === "PICKLIST") {
      submittedManagedAttribute.managedAttributeType = "STRING";
    } else if (
      submittedManagedAttribute.managedAttributeType === "INTEGER" ||
      submittedManagedAttribute.managedAttributeType === "STRING"
    ) {
      submittedManagedAttribute.acceptedValues = null;
    }

    await save(
      [
        {
          resource: submittedManagedAttribute,
          type: "managed-attribute"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await router.push(`/collection/managed-attribute/list`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <Link href="/collection/managed-attribute/list">
          <a className="btn btn-dark">
            <DinaMessage id="cancelButtonText" />
          </a>
        </Link>
      </ButtonBar>
      <div style={{ width: "300px" }}>
        <TextField name="name" readOnly={id !== undefined} />
      </div>
      <div style={{ width: "300px" }}>
        <SelectField
          name="managedAttributeComponent"
          options={ATTRIBUTE_COMPONENT_OPTIONS}
        />
      </div>
      <div style={{ width: "300px" }}>
        <SelectField
          name="managedAttributeType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: ManagedAttributeType) => setType(selectValue)}
        />
      </div>
      {type === "PICKLIST" && (
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
    </DinaForm>
  );
}

export default withRouter(ManagedAttributesDetailsPage);
