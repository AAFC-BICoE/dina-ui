import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import Link from "next/link";
import { ViewPageLayout } from "../../../components";
import { Collection } from "../../../types/collection-api";
import { CollectionFormFields } from "./edit";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export default function CollectionDetailsPage() {
  const buildQueryTree = (name: string) => {
    return {
      c: "AND",
      p: [
        {
          f: "collection.name",
          o: "equals",
          v: name,
          t: "autoComplete"
        }
      ]
    };
  };

  return (
    <ViewPageLayout<Collection>
      form={(props) => (
        <DinaForm<Collection>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            )
          }}
        >
          <CollectionFormFields />
          {props.initialValues.name && (
            <Link
              href={
                "/collection/material-sample/list?queryTree=" +
                JSON.stringify(buildQueryTree(props.initialValues.name))
              }
              passHref={true}
            >
              <a className="btn btn-info">
                <DinaMessage id="viewMaterialSamplesInCollection" />
              </a>
            </Link>
          )}
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/collection/${id}`,
        include: "institution,parentCollection"
      })}
      entityLink="/collection/collection"
      type="collection"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
