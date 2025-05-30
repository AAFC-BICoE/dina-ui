import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../../components";
import { ReportTemplateFormLayout } from "./edit";
import { ReportTemplate } from "../../../types/dina-export-api";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import Link from "next/link";

export default function ReportTemplateDetailsPage() {
  const backButton = (
    <Link
      href={"/export/report-template/upload"}
      className="back-button my-auto me-auto"
    >
      <DinaMessage id={"backToUpload"} />
    </Link>
  );
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
      backButton={backButton}
    />
  );
}
