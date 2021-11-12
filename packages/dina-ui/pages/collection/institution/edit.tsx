import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  SelectOption,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { toPairs, fromPairs } from "lodash";
import { useRouter } from "next/router";
import { Head, Nav, IdentifierFields } from "../../../components";
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
      <div className="container">
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
      </div>
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
        multilingualDescription: fromPairs<string | undefined>(
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
        descriptions: toPairs(submittedValues.multilingualDescription).map(
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
      <ButtonBar>
        <BackButton
          entityId={institution?.id}
          entityLink="/collection/institution"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <InstitutionFormLayout />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function InstitutionFormLayout() {
  const { formatMessage } = useDinaIntl();
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
      <div className="row">
        <TextField
          className="english-description"
          name="multilingualDescription.en"
          label={formatMessage("field_description.en")}
          multiLines={true}
        />
      </div>
      <div className="row">
        <TextField
          className="french-description"
          name="multilingualDescription.fr"
          label={formatMessage("field_description.fr")}
          multiLines={true}
        />
      </div>
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
