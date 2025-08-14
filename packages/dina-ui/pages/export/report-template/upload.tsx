import {
  DinaForm,
  useAccount,
  useModal,
  AreYouSureModal,
  useApiClient
} from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { GroupSelectField } from "../../../components/group-select/GroupSelectField";
import {
  FileUploader,
  FileUploaderOnSubmitArgs
} from "../../../components/object-store";
import { useFileUpload } from "../../../components/object-store/file-upload/FileUploadProvider";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ReportTemplateUpload } from "packages/dina-ui/types/objectstore-api/resources/ReportTemplateUpload";
import { InputResource } from "kitsu";

export const BULK_ADD_IDS_KEY = "bulkAddIds";

export interface OnSubmitValues {
  group?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { initialized: accountInitialized, groupNames } = useAccount();
  const { uploadFiles } = useFileUpload();
  const { openModal } = useModal();
  const { save } = useApiClient();

  async function onSubmit({
    acceptedFiles,
    group
  }: FileUploaderOnSubmitArgs<OnSubmitValues>) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }
    const unsupportedFile = acceptedFiles.find(
      (file) => !file.meta.name.endsWith(".ftlh")
    );
    if (unsupportedFile) {
      throw new Error(
        formatMessage("unsupportedFileTypeError", {
          fileName: unsupportedFile.meta.name
        })
      );
    } else if (acceptedFiles.length > 1) {
      throw new Error(formatMessage("maxNumUploadExceeded"));
    }

    const uploadRespsT = await uploadFiles({
      files: acceptedFiles,
      group,
      isDerivative: router?.query?.derivativeType ? true : false,
      isReportTemplate: true
    });

    const input: InputResource<ReportTemplateUpload> = {
      fileIdentifier: uploadRespsT?.[0]?.id,
      type: "report-template-upload"
    };

    const reportTemplateUploadResp = await save<ReportTemplateUpload>(
      [
        {
          resource: input,
          type: "report-template-upload"
        }
      ],
      {
        apiBaseUrl: "/objectstore-api"
      }
    );

    // Handle redirecting to metadata edit page for creating metadata objects
    const uploadDuplicates = uploadRespsT
      .filter((resp) => resp.meta?.warnings?.duplicate_found)
      .map(({ meta, originalFilename }) => ({ originalFilename, meta }));

    const navigateToEditReportTemplate = async () => {
      const objectUploadIds = uploadRespsT.map((item) => item.id);
      if (objectUploadIds.length === 1) {
        await router.push({
          pathname: "/export/report-template/edit",
          query: {
            group,
            objectUploadId: reportTemplateUploadResp[0].id
          }
        });
      }
    };

    if (Object.keys(uploadDuplicates)?.length === 0) {
      // No duplicate files, proceed to edit metadata page
      await navigateToEditReportTemplate();
    } else {
      openModal(
        <AreYouSureModal
          actionMessage={
            <span>
              <DinaMessage id="proceedToCreateMetadata" />
              <p>
                {`(${uploadDuplicates.length} `}
                {formatMessage("duplicateFilesFound") + " )"}
              </p>
            </span>
          }
          messageBody={
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>
                    <DinaMessage id="field_originalFilename" />
                  </th>
                  <th style={{ width: "40%" }}>
                    <DinaMessage id="warningMessage" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {uploadDuplicates.map(
                  (dup, idx) =>
                    dup.originalFilename && (
                      <tr key={idx} className={`${idx}-row`}>
                        <td>{dup.originalFilename}</td>
                        <td>{String(dup.meta?.warnings?.duplicate_found)}</td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          }
          onYesButtonClicked={navigateToEditReportTemplate}
        />
      );
    }
  }

  return (
    <div>
      <Head title={formatMessage("reportTemplateUpload")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="reportTemplateUpload" />
        </h1>
        {!accountInitialized || !groupNames?.length ? (
          <div className="alert alert-warning no-group-alert">
            <DinaMessage id="userMustBelongToGroup" />
          </div>
        ) : (
          <DinaForm<OnSubmitValues> initialValues={{}}>
            <div className="row">
              <GroupSelectField
                className="col-md-3"
                name="group"
                enableStoredDefaultGroup={true}
              />
            </div>
            <div>
              <FileUploader onSubmit={onSubmit} />
            </div>
          </DinaForm>
        )}
      </main>
      <Footer />
    </div>
  );
}
