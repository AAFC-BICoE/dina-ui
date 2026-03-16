import _ from "lodash";
import { DinaForm } from "common-ui";
import { ViewPageLayout } from "packages/dina-ui/components";
import SiteFormLayout from "packages/dina-ui/components/collection/site/SiteFormLayout";
import { Site } from "packages/dina-ui/types/collection-api";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";

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
          <SiteFormLayout mode={POLYGON_EDITOR_MODE.VIEW} />
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
