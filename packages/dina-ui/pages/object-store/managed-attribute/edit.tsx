// tslint:disable: no-string-literal
import {
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  SelectField,
  StringArrayField,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { fromPairs, toPairs } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { NextRouter, withRouter, useRouter } from "next/router";
import { useState } from "react";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  ManagedAttributeType,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../../types/objectstore-api/resources/ManagedAttribute";

interface ManagedAttributeFormProps {
  fetchedManagedAttribute?: ManagedAttribute;
  router: NextRouter;
  backButton: JSX.Element;
  postSaveRedirect: string;
}

export function ManagedAttributesEditPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();
  const { id } = router.query;
  const title = id ? "editManagedAttributeTitle" : "addManagedAttributeTitle";

  const query = useQuery<ManagedAttribute>(
    {
      path: `objectstore-api/managed-attribute/${id}`
    },
    { disabled: id === undefined }
  );

  const backButton =
    id === undefined ? (
      <Link href="/managed-attribute/list?step=1">
        <a className="back-button my-auto me-auto">
          <DinaMessage id="backToList" />
        </a>
      </Link>
    ) : (
      <Link href={`/object-store/managed-attribute/view?id=${id}`}>
        <a className="back-button my-auto me-auto">
          <DinaMessage id="backToReadOnlyPage" />
        </a>
      </Link>
    );
  const postSaveRedirect = "/object-store/managed-attribute/view";
  return (
    <div>
      {/* <Head title="Managed Attribute Details" /> */}
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editManagedAttributeTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ManagedAttributeForm
                fetchedManagedAttribute={data}
                router={router}
                backButton={backButton}
                postSaveRedirect={postSaveRedirect}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="addManagedAttributeTitle" />
            </h1>
            <br />
            <ManagedAttributeForm
              router={router}
              backButton={backButton}
              postSaveRedirect={postSaveRedirect}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ManagedAttributeForm({
  fetchedManagedAttribute,
  router,
  backButton,
  postSaveRedirect
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
    : {
        type: "managed-attribute"
      };

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

    if (!submittedValues.name || !submittedValues.vocabularyElementType) {
      throw new Error(
        formatMessage("field_managedAttributeMandatoryFieldsError")
      );
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
      descriptions: toPairs(submittedValues.multilingualDescription)
        .map(([lang, desc]) => ({ lang, desc }))
        .filter((it) => it.desc)
    };

    const [savedAttribute] = await save(
      [
        {
          resource: { type: "managed-attribute", ...submittedValues },
          type: "managed-attribute"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`${postSaveRedirect}?id=${savedAttribute.id}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        {backButton}
        <SubmitButton />
      </ButtonBar>
      <ManagedAttributeFormLayout />
    </DinaForm>
  );
}

export function ManagedAttributeFormLayout() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const { id: uuid } = router.query;
  const acceptedValueLen = initialValues?.acceptedValues?.length;
  const [type, setType] = useState(
    acceptedValueLen > 0 ? "PICKLIST" : initialValues.vocabularyElementType
  );
  const ATTRIBUTE_TYPE_OPTIONS = MANAGED_ATTRIBUTE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  return (
    <>
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          readOnly={uuid !== undefined}
        />
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="vocabularyElementType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: ManagedAttributeType) => setType(selectValue)}
        />
      </div>
      {type === "PICKLIST" && <StringArrayField name="acceptedValues" />}
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
      {uuid && (
        <div className="row">
          <DateField
            showTime={true}
            className="col-md-6"
            name="createdOn"
            disabled={true}
          />
          <TextField name="createdBy" className="col-md-6" readOnly={true} />
        </div>
      )}
    </>
  );
}

export default withRouter(ManagedAttributesEditPage);
