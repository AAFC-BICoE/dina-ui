import { DinaForm, Tooltip } from "common-ui";
import _ from "lodash";
import { ViewPageLayout } from "../../../components";
import { Assemblage } from "../../../types/collection-api/resources/Assemblage";
import { AssemblageFormLayout } from "./edit";

export default function AssemblageDetailsPage() {
  return (
    <ViewPageLayout<Assemblage>
      form={(props) => (
        <DinaForm<Assemblage>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: _.fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            ),
            multilingualTitle: _.fromPairs<string | undefined>(
              props.initialValues.multilingualTitle?.titles?.map(
                ({ title, lang }) => [lang ?? "", title ?? ""]
              )
            )
          }}
        >
          <AssemblageFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/assemblage/${id}?include=attachment`
      })}
      entityLink="/collection/assemblage"
      type="assemblage"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
      tooltipNode={
        <Tooltip
          id={"assemblage_tooltip"}
          link={"https://aafc-bicoe.github.io/dina-documentation/#assemblage"}
          linkText={"fromDinaUserGuide"}
          placement={"right"}
        />
      }
    />
  );
}
