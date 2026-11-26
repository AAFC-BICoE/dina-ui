import {
  DateField,
  DinaForm,
  MultilingualDescription,
  MultilingualTitle,
  RefSubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  useSubmitHandler,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import { RefObject, useRef } from "react";
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
  const formRef = useRef<FormikProps<any>>(null);

  const query = useQuery<ControlledVocabulary>(
    { path: `${apiPath}/controlled-vocabulary/${id}` },
    { disabled: !id }
  );

  const buttonBarContent = (
    <>
      <div className="col-md-6 col-sm-12 mt-2">
        <Link
          href={controlledVocabularyPageUrl(
            "/controlled-vocabulary-type/view",
            api,
            { id: String(id) }
          )}
          className="back-button my-auto me-auto"
        >
          <DinaMessage id="backToReadOnlyPage" />
        </Link>
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <RefSubmitButton formRef={formRef} className="ms-auto" />
      </div>
    </>
  );

  return (
    <PageLayout
      titleId="editControlledVocabularyTitle"
      buttonBarContent={buttonBarContent}
    >
      {withResponse(query, ({ data }) => (
        <ControlledVocabularyForm
          fetchedVocabulary={data}
          api={api}
          formRef={formRef}
        />
      ))}
    </PageLayout>
  );
}

function ControlledVocabularyForm({
  fetchedVocabulary,
  api,
  formRef
}: {
  fetchedVocabulary: PersistedResource<ControlledVocabulary>;
  api: ControlledVocabularyApi;
  formRef: RefObject<FormikProps<any> | null>;
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
      innerRef={formRef}
    >
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
