import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  Query,
  SubmitButton,
  TextField
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectionMethod } from "../../../types/collection-api/resources/CollectionMethod";

interface CollectionMethodFormProps {
  fetchedCollectionMethod?: CollectionMethod;
  onSaved: (colMethod: PersistedResource<CollectionMethod>) => Promise<void>;
}

export default function CollectionMethodEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(colMethod: PersistedResource<CollectionMethod>) {
    await router.push(`/collection/collection-method/view?id=${colMethod.id}`);
  }

  const title = id ? "editCollectionMethodTitle" : "addCollectionMethodTitle";

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
            <Query<CollectionMethod>
              query={{ path: `collection-api/collection-method/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <CollectionMethodForm
                      fetchedCollectionMethod={response.data}
                      onSaved={goToViewPage}
                    />
                  )}
                </div>
              )}
            </Query>
          ) : (
            <CollectionMethodForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export interface CollectionMethodFormValues
  extends InputResource<CollectionMethod> {}

export function CollectionMethodForm({
  fetchedCollectionMethod,
  onSaved
}: CollectionMethodFormProps) {
  const { save } = useContext(ApiClientContext);

  const initialValues: CollectionMethodFormValues = fetchedCollectionMethod
    ? {
        ...fetchedCollectionMethod,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: fromPairs<string | undefined>(
          fetchedCollectionMethod.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { name: "", type: "collection-method" };

  const onSubmit: DinaFormOnSubmit<CollectionMethodFormValues> = async ({
    submittedValues
  }) => {
    const input: InputResource<CollectionMethod> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    const [saveColMethod] = await save<CollectionMethod>(
      [
        {
          resource: input,
          type: "collection-method"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(saveColMethod);
  };

  return (
    <DinaForm<CollectionMethodFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <BackButton
          entityId={fetchedCollectionMethod?.id}
          entityLink="/collection/collection-method"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <CollectionMethodFormLayout />
    </DinaForm>
  );
}

export function CollectionMethodFormLayout() {
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
          className="col-md-6 name"
          name="name"
          label={formatMessage("collectionMethodNameLabel")}
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
