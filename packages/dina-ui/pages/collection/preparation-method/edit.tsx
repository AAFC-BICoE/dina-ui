import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
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
      <main className="container">
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
        multilingualDescription: fromPairs<string | undefined>(
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
        descriptions: toPairs(submittedValues.multilingualDescription).map(
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
      <ButtonBar>
        <BackButton
          entityId={fetchedPrepMethod?.id}
          entityLink="/collection/preparation-method"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <PreparationMethodFormLayout />
    </DinaForm>
  );
}

export function PreparationMethodFormLayout() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6 preparationMethodName"
          name="name"
          label={formatMessage("preparationMethodNameLabel")}
        />
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
    </div>
  );
}
