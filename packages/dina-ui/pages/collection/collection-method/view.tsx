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
import { withRouter } from "next/router";
import { CollectionMethod } from "../../../types/collection-api/resources/CollectionMethod";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectionMethodFormLayout } from "./edit";

export function CollecitonMethodDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const prepTypeQuery = useQuery<CollectionMethod>({
    path: `collection-api/collection-method/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("collectionMethodViewTitle")} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id="collectionMethodViewTitle" />
        </h1>
        <ButtonBar>
          <BackButton
            entityId={id as string}
            entityLink="/collection/collection-method"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id as string}
            entityLink="collection/collection-method"
          />
          <DeleteButton
            className="ms-5"
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/collection-method/list"
            type="collection-method"
          />
        </ButtonBar>
        {withResponse(prepTypeQuery, ({ data: collectionMethod }) => (
          <DinaForm<CollectionMethod>
            initialValues={{
              ...collectionMethod
            }}
            readOnly={true}
          >
            <CollectionMethodFormLayout />
          </DinaForm>
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default withRouter(CollecitonMethodDetailsPage);
