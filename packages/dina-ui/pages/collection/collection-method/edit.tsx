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
import { useRouter } from "next/router";
import { useContext } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectionMethod } from "../../../types/collection-api/resources/CollectionMethod";

interface CollectionMethodFormProps {
  fetchedCollectionMethod?: CollectionMethod;
  onSaved: (prepType: PersistedResource<CollectionMethod>) => Promise<void>;
}

export default function CollectionMethodEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(prepType: PersistedResource<CollectionMethod>) {
    await router.push(`/collection/collection-method/view?id=${prepType.id}`);
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
        ...fetchedCollectionMethod
      }
    : { name: "", type: "collection-method" };

  const onSubmit: DinaFormOnSubmit<CollectionMethodFormValues> = async ({
    submittedValues
  }) => {
    const input: InputResource<CollectionMethod> = {
      ...submittedValues
    };

    const [savedPrepType] = await save<CollectionMethod>(
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
    await onSaved(savedPrepType);
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
          className="col-md-6 preparationTypeName"
          name="name"
          label={formatMessage("collectionMethodNameLabel")}
        />
      </div>
    </div>
  );
}
