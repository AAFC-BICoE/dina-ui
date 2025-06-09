import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  MultilingualDescription,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
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

  const query = useQuery<CollectionMethod>({
    path: `collection-api/collection-method/${id}`
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
              <CollectionMethodForm
                fetchedCollectionMethod={data}
                onSaved={goToViewPage}
              />
            ))
          ) : (
            <CollectionMethodForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
      <Footer />
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
        multilingualDescription: _.fromPairs<string | undefined>(
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
        descriptions: _.toPairs(submittedValues.multilingualDescription).map(
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
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedCollectionMethod?.id}
            entityLink="/collection/collection-method"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <CollectionMethodFormLayout />
    </DinaForm>
  );
}

export function CollectionMethodFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("collectionMethodNameLabel")}
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
      {readOnly && (
        <div className="row">
          <DateField name="createdOn" />
          <TextField name="createdBy" />
        </div>
      )}
    </div>
  );
}
