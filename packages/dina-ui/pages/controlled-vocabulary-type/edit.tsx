import {
  ButtonBar,
  DateField,
  DinaForm,
  MultilingualDescription,
  MultilingualTitle,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  useSubmitHandler,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  CONTROLLED_VOCABULARY_APIS,
  ControlledVocabularyApi,
  controlledVocabularyPageUrl,
  getControlledVocabularyApi,
  multilingualFieldsForForm,
  multilingualFieldsForSave
} from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import PageLayout from "../../components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ControlledVocabulary } from "../../types/collection-api/resources/ControlledVocabulary";

export default function ControlledVocabularyEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const api = getControlledVocabularyApi(router.query);
  const { apiPath } = CONTROLLED_VOCABULARY_APIS[api];

  const query = useQuery<ControlledVocabulary>(
    { path: `${apiPath}/controlled-vocabulary/${id}` },
    { disabled: !id }
  );

  return (
    <PageLayout titleId="editControlledVocabularyTitle">
      {withResponse(query, ({ data }) => (
        <ControlledVocabularyForm fetchedVocabulary={data} api={api} />
      ))}
    </PageLayout>
  );
}

function ControlledVocabularyForm({
  fetchedVocabulary,
  api
}: {
  fetchedVocabulary: PersistedResource<ControlledVocabulary>;
  api: ControlledVocabularyApi;
}) {
  const router = useRouter();
  const { apiBaseUrl } = CONTROLLED_VOCABULARY_APIS[api];
  const viewPageUrl = controlledVocabularyPageUrl(
    "/controlled-vocabulary-type/view",
    api,
    { id: fetchedVocabulary.id }
  );

  const onSubmit = useSubmitHandler<InputResource<ControlledVocabulary>>({
    resourceType: "controlled-vocabulary",
    original: fetchedVocabulary,
    saveOptions: { apiBaseUrl },
    transforms: [multilingualFieldsForSave],
    onSuccess: async () => {
      await router.push(viewPageUrl);
    }
  });

  return (
    <DinaForm<InputResource<ControlledVocabulary>>
      initialValues={
        {
          ...fetchedVocabulary,
          ...multilingualFieldsForForm(fetchedVocabulary)
        } as InputResource<ControlledVocabulary>
      }
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <Link href={viewPageUrl} className="back-button my-auto me-auto">
            <DinaMessage id="backToReadOnlyPage" />
          </Link>
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <ControlledVocabularyFormLayout />
    </DinaForm>
  );
}

/** Fields of a controlled vocabulary, shared by its view and edit pages. */
export function ControlledVocabularyFormLayout() {
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();

  return (
    <>
      <div className="row">
        <TextField className="col-md-6" name="name" requiredField={true} />
        {/* The key is the vocabulary's stable identifier, so it can't be changed. */}
        <TextField className="col-md-6" name="key" disabled={true} />
      </div>
      <div className="row">
        {/* "type" can't be sent: it clashes with the JSON:API resource type. */}
        <TextField className="col-md-6" name="type" disabled={true} />
        <TextField className="col-md-6" name="vocabClass" disabled={true} />
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="term"
          link={initialValues?.term ?? ""}
        />
        {readOnly && <TextField className="col-md-6" name="version" />}
      </div>
      <MultilingualTitle />
      <MultilingualDescription />
      {readOnly && (
        <div className="row">
          <DateField
            className="col-md-6"
            name="createdOn"
            label={formatMessage("field_createdOn")}
            showTime={true}
          />
          <TextField
            className="col-md-6"
            name="createdBy"
            label={formatMessage("field_createdBy")}
          />
        </div>
      )}
    </>
  );
}
