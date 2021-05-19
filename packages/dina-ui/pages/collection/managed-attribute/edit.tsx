// tslint:disable: no-string-literal
import {
  ButtonBar,
  DateField,
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
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS,
  ManagedAttribute,
  ManagedAttributeType,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../../types/collection-api/resources/ManagedAttribute";

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

  const initialValues: Partial<ManagedAttribute> = fetchedManagedAttribute || {
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

  const onSubmit: DinaFormOnSubmit<Partial<ManagedAttribute>> = async ({
    api: { save },
    submittedValues
  }) => {
    // Treat empty array or undefined as null:
    if (!submittedValues.acceptedValues?.length) {
      submittedValues.acceptedValues = null;
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
      <div style={{ width: "25rem" }}>
        <TextField name="name" readOnly={id !== undefined} />
      </div>
      <div style={{ width: "25rem" }}>
        <SelectField
          name="managedAttributeComponent"
          options={ATTRIBUTE_COMPONENT_OPTIONS}
        />
      </div>
      <div style={{ width: "25rem" }}>
        <SelectField
          name="managedAttributeType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: ManagedAttributeType) => setType(selectValue)}
        />
      </div>
      {type === "PICKLIST" && (
        <div style={{ width: "25rem" }}>
          <StringArrayField name="acceptedValues" />
        </div>
      )}
      {id && (
        <div style={{ width: "25rem" }}>
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
        <div style={{ width: "25rem" }}>
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
