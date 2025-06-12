import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useQuery,
  withResponse,
  useDinaFormContext,
  MultilingualDescription
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { PreparationMethod } from "../../../types/collection-api/resources/PreparationMethod";

interface PreparationMethodFormProps {
  fetchedPrepMethod?: PreparationMethod;
  onSaved: (prepMethod: PersistedResource<PreparationMethod>) => Promise<void>;
}

export default function PreparationMethodEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(
    prepMethod: PersistedResource<PreparationMethod>
  ) {
    await router.push(
      `/collection/preparation-method/view?id=${prepMethod.id}`
    );
  }

  const title = id ? "editPreparationMethodTitle" : "addPreparationMethodTitle";

  const query = useQuery<PreparationMethod>({
    path: `collection-api/preparation-method/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <PreparationMethodForm
                fetchedPrepMethod={data}
                onSaved={goToViewPage}
              />
            ))
          ) : (
            <PreparationMethodForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export interface PreparationMethodFormValues
  extends InputResource<PreparationMethod> {
  multilingualDescription?: Record<string, string | undefined>;
}

export function PreparationMethodForm({
  fetchedPrepMethod,
  onSaved
}: PreparationMethodFormProps) {
  const { save } = useContext(ApiClientContext);

  const initialValues: PreparationMethodFormValues = fetchedPrepMethod
    ? {
        ...fetchedPrepMethod,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: _.fromPairs<string | undefined>(
          fetchedPrepMethod.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { name: "", type: "preparation-method" };

  const onSubmit: DinaFormOnSubmit<PreparationMethodFormValues> = async ({
    submittedValues
  }) => {
    const input: InputResource<PreparationMethod> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: _.toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    const [savedPrepMethod] = await save<PreparationMethod>(
      [
        {
          resource: input,
          type: "preparation-method"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedPrepMethod);
  };

  return (
    <DinaForm<PreparationMethodFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedPrepMethod?.id}
            entityLink="/collection/preparation-method"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <PreparationMethodFormLayout />
    </DinaForm>
  );
}

export function PreparationMethodFormLayout() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 preparationMethodName"
          name="name"
          label={formatMessage("preparationMethodNameLabel")}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <MultilingualDescription />
    </div>
  );
}
