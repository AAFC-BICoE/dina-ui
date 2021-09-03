import { DinaForm, useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav, ResourceViewButtonBar } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection } from "../../../types/collection-api";
import { CollectionFormFields } from "./edit";

export function CollectionDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const collectionQuery = useQuery<Collection>({
    path: `collection-api/collection/${id}`,
    include: "institution",
    header: { "include-dina-permission": "true" }
  });

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
            <ResourceViewButtonBar
              resource={collection}
              apiBaseUrl="/collection-api"
              resourceBaseUrl="/collection/collection"
            />
            <CollectionFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(CollectionDetailsPage);
