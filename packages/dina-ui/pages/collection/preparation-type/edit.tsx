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
import { fromPairs, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { PreparationType } from "../../../types/collection-api/resources/PreparationType";

interface PreparationTypeFormProps {
  fetchedPrepType?: PreparationType;
  onSaved: (prepType: PersistedResource<PreparationType>) => Promise<void>;
}

export default function PreparationTypeEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(prepType: PersistedResource<PreparationType>) {
    await router.push(`/collection/preparation-type/view?id=${prepType.id}`);
  }

  const title = id ? "editPreparationTypeTitle" : "addPreparationTypeTitle";

  const query = useQuery<PreparationType>({
    path: `collection-api/preparation-type/${id}`
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
              <PreparationTypeForm
                fetchedPrepType={data}
                onSaved={goToViewPage}
              />
            ))
          ) : (
            <PreparationTypeForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export interface PreparationTypeFormValues
  extends InputResource<PreparationType> {
  multilingualDescription?: Record<string, string | undefined>;
}

export function PreparationTypeForm({
  fetchedPrepType,
  onSaved
}: PreparationTypeFormProps) {
  const { save } = useContext(ApiClientContext);

  const initialValues: PreparationTypeFormValues = fetchedPrepType
    ? {
        ...fetchedPrepType,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: fromPairs<string | undefined>(
          fetchedPrepType.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { name: "", type: "preparation-type" };

  const onSubmit: DinaFormOnSubmit<PreparationTypeFormValues> = async ({
    submittedValues
  }) => {
    const input: InputResource<PreparationType> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    const [savedPrepType] = await save<PreparationType>(
      [
        {
          resource: input,
          type: "preparation-type"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedPrepType);
  };

  return (
    <DinaForm<PreparationTypeFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <BackButton
          entityId={fetchedPrepType?.id}
          entityLink="/collection/preparation-type"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <PreparationTypeFormLayout />
    </DinaForm>
  );
}

export function PreparationTypeFormLayout() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 preparationTypeName"
          name="name"
          label={formatMessage("preparationTypeNameLabel")}
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
