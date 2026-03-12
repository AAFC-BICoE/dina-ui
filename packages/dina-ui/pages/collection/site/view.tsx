import _ from "lodash";
import { DinaForm } from "common-ui";
import { ViewPageLayout } from "packages/dina-ui/components";
import { SiteFormLayout } from "packages/dina-ui/components/collection/site/SiteFormLayout";
import { Site } from "packages/dina-ui/types/collection-api";

export default function ViewPage() {
  return (
    <ViewPageLayout<Site>
      form={(props) => (
        <DinaForm<Site>
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
          <SiteFormLayout
            popupUrl="/collection/site/polygon-editor"
            messageId="viewOnMap"
          />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/site/${id}?include=attachment`
      })}
      entityLink="/collection/site"
      type="site"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
