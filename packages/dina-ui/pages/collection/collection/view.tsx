import { DinaForm } from "common-ui";
import _ from "lodash";
import Link from "next/link";
import { ViewPageLayout } from "../../../components";
import { Collection } from "../../../types/collection-api";
import { CollectionFormFields } from "./edit";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import CollectionSampleTypeChart from "./CollectionSampleTypeChart";
import CollectionRelatedObjectTypeChart from "./CollectionRelatedObjectTypeChart";
import { useRouter } from "next/router";

export default function CollectionDetailsPage() {
  const router = useRouter();
  const uuid = String(router.query.id);

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
            multilingualDescription: _.fromPairs<string | undefined>(
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
              className="btn btn-info"
            >
              <DinaMessage id="viewMaterialSamplesInCollection" />
            </Link>
          )}
          <div className="w-50">
            <CollectionSampleTypeChart id={uuid} />
          </div>
          <div className="w-50">
            <CollectionRelatedObjectTypeChart id={uuid} />
          </div>
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
