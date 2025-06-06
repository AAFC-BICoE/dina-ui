import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  MultilingualDescription,
  SelectOption,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { Head, Nav, IdentifierFields, Footer } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Institution } from "../../../types/collection-api";
import { Field } from "formik";
import { InstitutionIdentifierType } from "../../../types/collection-api/resources/InstitutionIdentifier";

export default function InstitutionEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const {
    query: { id }
  } = router;

  const institutionQuery = useQuery<Institution>(
    { path: `collection-api/institution/${id}` },
    { disabled: !id }
  );

  const title = id ? "editInstitutionTitle" : "addInstitutionTitle";

  async function goToViewPage(resource: PersistedResource<Institution>) {
    await router.push(`/collection/institution/view?id=${resource.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(institutionQuery, ({ data }) => (
            <InstitutionForm institution={data} onSaved={goToViewPage} />
          ))
        ) : (
          <InstitutionForm onSaved={goToViewPage} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export interface InstitutionFormProps {
  institution?: PersistedResource<Institution>;
  onSaved: (resource: PersistedResource<Institution>) => Promise<void>;
}

export function InstitutionForm({
  onSaved,
  institution
}: InstitutionFormProps) {
  const initialValues = institution
    ? {
        ...institution,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: _.fromPairs<string | undefined>(
          institution.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { type: "institution" };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<Institution>) {
    const input: InputResource<Institution> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: _.toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc: desc as any })
        )
      }
    };

    const [savedResource] = await save<Institution>(
      [
        {
          resource: input,
          type: "institution"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    await onSaved(savedResource);
  }

  return (
    <DinaForm<Partial<Institution>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={institution?.id}
            entityLink="/collection/institution"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <InstitutionFormLayout />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function InstitutionFormLayout() {
  const { readOnly } = useDinaFormContext();
  const typeOptions: SelectOption<string | undefined>[] = [
    {
      label: InstitutionIdentifierType.GRSCICOLL,
      value: InstitutionIdentifierType.GRSCICOLL
    }
  ];

  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
      </div>
      <MultilingualDescription />
      <div className="row">
        <TextField className="col-md-6" name="webpage" />
        <TextField className="col-md-6" name="address" multiLines={true} />
      </div>
      <div className="row">
        <TextField name="remarks" multiLines={true} />
      </div>
      <Field name="identifiers">
        {({ form: { values: formState } }) =>
          !readOnly ? (
            <IdentifierFields typeOptions={typeOptions} />
          ) : !!formState.identifiers?.length ? (
            <IdentifierFields typeOptions={typeOptions} />
          ) : null
        }
      </Field>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
