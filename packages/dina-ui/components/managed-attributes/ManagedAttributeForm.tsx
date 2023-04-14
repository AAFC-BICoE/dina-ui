import {
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  SelectField,
  StringArrayField,
  SubmitButton,
  TextField,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import { NextRouter, useRouter } from "next/router";
import { useState } from "react";
import { GroupSelectField } from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS,
  VocabularyElementType
} from "../../types/collection-api";

export interface ManagedAttributeFormProps {
  fetchedManagedAttribute?: PersistedResource<ManagedAttribute>;
  router: NextRouter;
  apiBaseUrl: string;
  postSaveRedirect: string;
  backButton: JSX.Element;
  /** Optionally render a "managedAttributeComponent field." */
  componentField?: JSX.Element;
  withGroup?: boolean;
}

export function ManagedAttributeForm({
  fetchedManagedAttribute,
  router,
  apiBaseUrl,
  postSaveRedirect,
  backButton,
  componentField,
  withGroup = true
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

  if ((initialValues && initialValues?.acceptedValues?.length) || 0 > 0) {
    initialValues.vocabularyElementType = "PICKLIST";
  }

  const onSubmit: DinaFormOnSubmit<Partial<ManagedAttribute>> = async ({
    api: { save },
    submittedValues
  }) => {
    // Treat empty array or undefined as null:
    if (!submittedValues.acceptedValues?.length) {
      submittedValues.acceptedValues = null;
    }

    if (submittedValues.vocabularyElementType === "PICKLIST") {
      submittedValues.vocabularyElementType = "STRING";
    } else if (
      submittedValues.vocabularyElementType === "INTEGER" ||
      submittedValues.vocabularyElementType === "STRING"
    ) {
      submittedValues.acceptedValues = null;
    }

    // Convert the editable format to the stored format:
    submittedValues.multilingualDescription = {
      descriptions: toPairs(submittedValues.multilingualDescription).map(
        ([lang, desc]) => ({ lang, desc })
      )
    };

    const [savedAttribute] = await save(
      [
        {
          resource: { type: "managed-attribute", ...submittedValues },
          type: "managed-attribute"
        }
      ],
      { apiBaseUrl }
    );

    await router.push(`${postSaveRedirect}?id=${savedAttribute.id}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        {backButton}
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <ManagedAttributeFormLayout
        componentField={componentField}
        withGroup={withGroup}
      />
    </DinaForm>
  );
}

export interface ManagedAttributeFormLayoutLayoutProps {
  componentField?: JSX.Element;
  withGroup?: boolean;
}

export function ManagedAttributeFormLayout({
  componentField,
  withGroup = true
}: ManagedAttributeFormLayoutLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();
  const [type, setType] = useState(
    initialValues
      ? initialValues?.acceptedValues?.length
        ? "PICKLIST"
        : initialValues.vocabularyElementType
      : undefined
  );

  const router = useRouter();
  const uuid = String(router?.query?.id);
  const ATTRIBUTE_TYPE_OPTIONS = MANAGED_ATTRIBUTE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );
  return (
    <>
      {withGroup ? (
        <div className="row">
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        </div>
      ) : undefined}
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          readOnly={uuid !== undefined && uuid !== "undefined"}
        />
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
      <div className="row">{componentField}</div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="vocabularyElementType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: VocabularyElementType) =>
            setType && setType(selectValue)
          }
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
      {readOnly && (
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
    </>
  );
}
