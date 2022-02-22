import {
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  SelectField,
  StringArrayField,
  SubmitButton,
  TextField
} from "common-ui";
import { PersistedResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import Link from "next/link";
import { NextRouter } from "next/router";
import { useState } from "react";
import { GroupSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  ManagedAttributeType,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../types/collection-api/resources/ManagedAttribute";

export interface ManagedAttributeFormProps {
  fetchedManagedAttribute?: PersistedResource<ManagedAttribute>;
  router: NextRouter;
  apiBaseUrl: string;
  postSaveRedirect: string;
  /** THe href to the list page. */
  listHref: string;
  /** Optionally render a "managedAttributeComponent field." */
  componentField?: JSX.Element;
}

export function ManagedAttributeForm({
  fetchedManagedAttribute,
  router,
  apiBaseUrl,
  postSaveRedirect,
  listHref,
  componentField
}: ManagedAttributeFormProps) {
  const { formatMessage } = useDinaIntl();

  const id = fetchedManagedAttribute?.id;

  const initialValues: Partial<ManagedAttribute> = fetchedManagedAttribute
    ? {
        ...fetchedManagedAttribute,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: fromPairs<string | undefined>(
          fetchedManagedAttribute.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { type: "managed-attribute" };

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

    // Convert the editable format to the stored format:
    submittedValues.multilingualDescription = {
      descriptions: toPairs(submittedValues.multilingualDescription).map(
        ([lang, desc]) => ({ lang, desc })
      )
    };

    await save(
      [
        {
          resource: { type: "managed-attribute", ...submittedValues },
          type: "managed-attribute"
        }
      ],
      { apiBaseUrl }
    );

    await router.push(postSaveRedirect);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <Link href={listHref}>
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
      <div className="row">{componentField}</div>
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
      <div className="row">
        <TextField
          className="col-md-6 english-description"
          name="multilingualDescription.en"
          label={formatMessage("field_description.en")}
          multiLines={true}
        />
        <TextField
          className="col-md-6 french-description"
          name="multilingualDescription.fr"
          label={formatMessage("field_description.fr")}
          multiLines={true}
        />
      </div>
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
