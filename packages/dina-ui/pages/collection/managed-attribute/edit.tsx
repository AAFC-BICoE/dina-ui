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

import { GroupSelectField } from "../../../components";

interface ManagedAttributeFormProps {
  fetchedManagedAttribute?: ManagedAttribute;
  router: NextRouter;
}

export function ManagedAttributesDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const title = id ? "editManagedAttributeTitle" : "addManagedAttributeTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editManagedAttributeTitle" />
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
              <DinaMessage id="addManagedAttributeTitle" />
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
      <div className="row">
        <GroupSelectField
          className="col-md-6"
          name="group"
          enableStoredDefaultGroup={true}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          readOnly={id !== undefined}
        />
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="managedAttributeComponent"
          options={ATTRIBUTE_COMPONENT_OPTIONS}
        />
      </div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="managedAttributeType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: ManagedAttributeType) => setType(selectValue)}
        />
      </div>
      {type === "PICKLIST" && (
        <div className="row">
          <div className="col-md-6">
            <StringArrayField name="acceptedValues" />
          </div>
        </div>
      )}
      {id && (
        <div className="row">
          <DateField
            className="col-md-6"
            showTime={true}
            name="createdOn"
            disabled={true}
          />
          <TextField className="col-md-6" name="createdBy" readOnly={true} />
        </div>
      )}
    </DinaForm>
  );
}

export default withRouter(ManagedAttributesDetailsPage);
