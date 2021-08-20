import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection } from "../../../types/collection-api";
import { CollectionFormFields } from "./edit";
import { withRouter } from "next/router";

export function CollectionDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const collectionQuery = useQuery<Collection>(
    {
      path: `collection-api/collection/${id}`
    },
    {
      header: { "include-dina-permission": "true" }
    }
  );

  const buttonBar = collection => {
    return (
      <ButtonBar>
        <BackButton
          entityId={id}
          entityLink="/collection/collection"
          byPassView={true}
        />
        {(collection.meta?.permissions?.includes("create") ||
          collection.meta?.permissions?.includes("update")) && (
          <EditButton
            className="ms-auto"
            entityId={id}
            entityLink="collection/collection"
          />
        )}
        {collection.meta?.permissions?.includes("delete") && (
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/collection/list"
            type="collection"
          />
        )}
      </ButtonBar>
    );
  };

  return (
    <div>
      <Head title={formatMessage("collectionViewTitle")} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id="collectionViewTitle" />
        </h1>
        {withResponse(collectionQuery, ({ data: collection }) => (
          <DinaForm<Collection> initialValues={collection} readOnly={true}>
            {buttonBar(collection)}
            <CollectionFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(CollectionDetailsPage);
