import { ApiClientContext, LoadingSpinner } from "common-ui";
import { withRouter } from "next/router";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { SaveWorkbookProgress } from "packages/dina-ui/components/workbook/SaveWorkbookProgress";
import { useContext, useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import {
  WorkbookColumnMapping,
  WorkbookJSON,
  WorkbookUpload,
  useWorkbookContext
} from "../../components";
import { IFileWithMeta } from "../../components/object-store";
import { DinaMessage } from "../../intl/dina-ui-intl";

export function UploadWorkbookPage() {
  const { apiClient } = useContext(ApiClientContext);
  const { workbookResources, status, reset, spreadsheetData, uploadWorkbook } =
    useWorkbookContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);

  /**
   * Call the object store backend API that takes in a spreadsheet and returns
   * a JSON format representation of the spreadsheet.
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
        uploadWorkbook(response.data);
        setLoading(false);
        setFailed(false);
      })
      .catch(() => {
        setLoading(false);
        setFailed(true);
      });
  }

  function backToUpload() {
    setFailed(false);
    setLoading(false);
    setPerformSave(false);
    reset();
  }

  const failedMessage = failed ? (
    <div className="alert alert-danger">
      <DinaMessage id="workbookUploadFailure" />
    </div>
  ) : undefined;

  function isThereAnActiveUpload(): boolean {
    return (
      workbookResources &&
      workbookResources.length > 0 &&
      status !== "CANCELED" &&
      status !== "FINISHED"
    );
  }

  const buttonBar =
    !isThereAnActiveUpload() && !!spreadsheetData ? (
      <>
        <button onClick={() => backToUpload()} className="btn btn-secondary">
          <DinaMessage id="cancelButtonText" />
        </button>
        <Button
          variant={"primary"}
          className="ms-auto"
          onClick={() => setPerformSave(true)}
          style={{ width: "10rem" }}
        >
          {performSave ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="visually-hidden">Loading...</span>
            </>
          ) : (
            <DinaMessage id="save" />
          )}
        </Button>
      </>
    ) : undefined;

  return (
    <PageLayout titleId="workbookGroupUploadTitle" buttonBarContent={buttonBar}>
      {loading === true ? (
        <LoadingSpinner loading={true} />
      ) : (
        <>
          {isThereAnActiveUpload() ? (
            // If there is an unfinished upload
            <SaveWorkbookProgress
              onWorkbookSaved={backToUpload}
              onWorkbookCanceled={backToUpload}
              onWorkbookFailed={backToUpload}
            />
          ) : spreadsheetData ? (
            <WorkbookColumnMapping
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
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

export default withRouter(UploadWorkbookPage);
