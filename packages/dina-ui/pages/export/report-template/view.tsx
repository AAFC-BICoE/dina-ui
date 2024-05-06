import { DinaForm, Tooltip } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../../components";
import { ReportTemplateFormLayout } from "./edit";
import { ReportTemplate } from "../../../types/dina-export-api";

export default function ReportTemplateDetailsPage() {
  return (
    <ViewPageLayout<ReportTemplate>
      form={(props) => (
        <DinaForm<ReportTemplate>
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
          <ReportTemplateFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `dina-export-api/report-template/${id}`
      })}
      entityLink="/export/report-template"
      type="report-template"
      apiBaseUrl="/dina-export-api"
      specialListUrl="/export/report-template/upload"
    />
  );
}
