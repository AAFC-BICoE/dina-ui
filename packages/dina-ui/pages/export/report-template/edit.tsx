import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useQuery,
  withResponse,
  MultilingualDescription,
  ToggleField
} from "common-ui";
import { InputResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ReportTemplate } from "packages/dina-ui/types/dina-export-api";
import Link from "next/link";

interface ReportTemplateFormProps {
  fetchedReportTemplate?: ReportTemplate;
  onSaved: () => Promise<void>;
}

export default function ReportEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function redirectHandler() {
    await router.push(`/export/report-template/upload`);
  }

  const title = id ? "editReportTemplateTitle" : "addReportTemplateTitle";

  const query = useQuery<ReportTemplate>({
    path: `dina-export-api/report-template/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid px-5">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <ReportTemplateForm
                fetchedReportTemplate={data}
                onSaved={redirectHandler}
              />
            ))
          ) : (
            <ReportTemplateForm onSaved={redirectHandler} />
          )}
        </div>
      </main>
    </div>
  );
}

export interface ReportTemplateFormValues
  extends InputResource<ReportTemplate> {}

export function ReportTemplateForm({
  fetchedReportTemplate,
  onSaved
}: ReportTemplateFormProps) {
  const { save } = useContext(ApiClientContext);
  const router = useRouter();
  const {
    query: { group, objectUploadId }
  } = router;

  const initialValues: ReportTemplateFormValues = fetchedReportTemplate
    ? {
        ...fetchedReportTemplate,
        multilingualDescription: fromPairs<string | undefined>(
          fetchedReportTemplate.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : {
        type: "report-template",
        templateFilename: `${String(objectUploadId)}.ftlh`,
        group: String(group),
        templateOutputMediaType: "text/html",
        outputMediaType: "application/pdf"
      };

  const onSubmit: DinaFormOnSubmit<ReportTemplateFormValues> = async ({
    submittedValues
  }) => {
    const input: InputResource<ReportTemplate> = {
      ...submittedValues,
      multilingualDescription: {
        descriptions: toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    const [savedReportTemplate] = await save<ReportTemplate>(
      [
        {
          resource: input,
          type: "report-template"
        }
      ],
      {
        apiBaseUrl: "/dina-export-api"
      }
    );
    await onSaved();
  };

  return (
    <DinaForm<ReportTemplateFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <Link href={"/export/report-template/upload"}>
          <a className={`back-button my-auto`}>
            <DinaMessage id={"backToUpload"} />
          </a>
        </Link>
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <ReportTemplateFormLayout />
    </DinaForm>
  );
}

export function ReportTemplateFormLayout() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_reportTemplateName")}
        />
        <ToggleField
          className="col-md-6 name"
          name={"includesBarcode"}
          label={formatMessage("field_includesBarcode")}
        />
      </div>
      <div className="row">
        {" "}
        <TextField
          className="col-md-6 name"
          name="templateOutputMediaType"
          label={formatMessage("field_templateOutputMediaType")}
          readOnly={true}
        />
        <TextField
          className="col-md-6 name"
          name="outputMediaType"
          label={formatMessage("field_outputMediaType")}
          readOnly={true}
        />
      </div>
      <MultilingualDescription />
    </div>
  );
}
