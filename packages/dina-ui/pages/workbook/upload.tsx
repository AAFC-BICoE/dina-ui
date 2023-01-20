import { ApiClientContext, LoadingSpinner } from "common-ui";
import { useContext, useState } from "react";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { WorkbookJSON } from "../../components/workbook/types/Workbook";
import { IFileWithMeta } from "../../components/object-store";
import { WorkbookUpload } from "../../components/workbook/WorkbookUpload";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { WorkbookColumnMapping } from "packages/dina-ui/components/workbook/WorkbookColumnMapping";

export default function UploadWorkbookPage() {
  const { apiClient } = useContext(ApiClientContext);

  const [jsonData, setJsonData] = useState<WorkbookJSON | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  /**
   * Using the object store backend that takes in a spreadsheet and returns a JSON format
   * representation of the spreadsheet.
   *
   * @param acceptedFiles Files from the file uploader.
   */
  async function submitFile(acceptedFiles: IFileWithMeta[]) {
    const formData = new FormData();
    formData.append("file", acceptedFiles[0].file);

    // Display the loading spinner, and reset any error messages.
    setLoading(true);

    // Attempt to call the conversion API.
    await apiClient.axios
      .post("/objectstore-api/conversion/workbook", formData)
      .then((response) => {
        setJsonData(response.data);
        setLoading(false);
        setFailed(false);
      })
      .catch(() => {
        setJsonData(null);
        setLoading(false);
        setFailed(true);
      });
  }

  function backToUpload() {
    setJsonData(null);
    setFailed(false);
    setLoading(false);
  }

  const failedMessage = failed ? (
    <div className="alert alert-danger">
      <DinaMessage id="workbookUploadFailure" />
    </div>
  ) : undefined;

  const buttonBar = jsonData ? (
    <button onClick={backToUpload} className="btn btn-secondary">
      <DinaMessage id="cancelButtonText" />
    </button>
  ) : undefined;

  return (
    <PageLayout titleId="workbookGroupUploadTitle" buttonBarContent={buttonBar}>
      {loading === true ? (
        <LoadingSpinner loading={true} />
      ) : (
        <>
          {jsonData ? (
            <WorkbookColumnMapping spreadsheetData={jsonData} />
          ) : (
            <>
              {failedMessage}
              <WorkbookUpload submitData={submitFile} />
            </>
          )}
        </>
      )}
    </PageLayout>
  );
}
