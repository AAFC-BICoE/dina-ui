import {
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  MultilingualDescription,
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

    // Don't save unit if type is not INTEGER/DECIMAL
    if (
      submittedValues.vocabularyElementType !== "INTEGER" &&
      submittedValues.vocabularyElementType !== "DECIMAL"
    ) {
      delete submittedValues.unit;
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
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">{backButton}</div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
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
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          readOnly={uuid !== undefined && uuid !== "undefined"}
        />
        {withGroup && !readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
      </div>
      <div className="row">
        {componentField}
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="vocabularyElementType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: VocabularyElementType) =>
            setType && setType(selectValue)
          }
        />
        {router.route.includes("collection") &&
          (type === "DECIMAL" || type === "INTEGER") && (
            <TextField className="col-md-6" name="unit" />
          )}
      </div>
      {type === "PICKLIST" && (
        <div className="row">
          <div className="col-md-6">
            <StringArrayField name="acceptedValues" />
          </div>
        </div>
      )}
      <MultilingualDescription />
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
