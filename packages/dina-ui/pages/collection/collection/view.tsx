import { DinaForm, useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav, ResourceViewButtonBar } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection } from "../../../types/collection-api";
import { CollectionFormFields } from "./edit";
import { fromPairs } from "lodash";

export function CollectionDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const collectionQuery = useQuery<Collection>({
    path: `collection-api/collection/${id}?include=institution`,
    header: { "include-dina-permission": "true" }
  });

  return (
    <div>
      <Head title={formatMessage("collectionViewTitle")} />
      <Nav />
      <main className="container">
        {withResponse(collectionQuery, ({ data: collection }) => (
          <DinaForm<Collection>
            initialValues={{
              ...collection,
              // Convert multilingualDescription to editable Dictionary format:
              multilingualDescription: fromPairs<string | undefined>(
                collection.multilingualDescription?.descriptions?.map(
                  ({ desc, lang }) => [lang ?? "", desc ?? ""]
                )
              )
            }}
            readOnly={true}
          >
            <ResourceViewButtonBar
              resource={collection}
              apiBaseUrl="/collection-api"
              resourceBaseUrl="collection/collection"
            />
            <CollectionFormFields title={"collectionViewTitle"} />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(CollectionDetailsPage);
