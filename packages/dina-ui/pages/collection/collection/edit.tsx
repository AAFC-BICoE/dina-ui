import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { NextRouter, useRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection } from "../../../types/collection-api";

export default function CollectionEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const {
    query: { id }
  } = router;

  const collectionQuery = useQuery<Collection>(
    { path: `collection-api/collection/${id}` },
    { disabled: !id }
  );

  const title = id ? "editCollectionTitle" : "addCollectionTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1>
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(collectionQuery, ({ data }) => (
            <CollectionForm collection={data} router={router} />
          ))
        ) : (
          <CollectionForm router={router} />
        )}
      </div>
    </div>
  );
}

export interface CollectionFormProps {
  collection?: PersistedResource<Collection>;
  router: NextRouter;
}

export function CollectionForm({ collection, router }: CollectionFormProps) {
  const initialValues = collection || { type: "collection" };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<Collection>) {
    const [savedCollection] = await save(
      [
        {
          resource: submittedValues,
          type: "collection"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    await router.push(`/collection/collection/view?id=${savedCollection.id}`);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={collection?.id}
        entityLink="/collection/collection"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm<Collection> initialValues={initialValues} onSubmit={onSubmit}>
      {buttonBar}
      <CollectionFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function CollectionFormFields() {
  const { initialValues, readOnly } = useDinaFormContext();
  const collection: Collection = initialValues;

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
        <TextField className="col-md-6" name="name" />
        <TextField className="col-md-6" name="code" />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
