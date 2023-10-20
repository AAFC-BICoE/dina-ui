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
  const { isThereAnActiveUpload, cleanUp, progress, workbookResources } =
    useWorkbookContext();

  const [spreadsheetData, setSpreadsheetData] = useState<WorkbookJSON | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);

  useEffect(() => {
    if (progress === workbookResources.length) {
      cleanUp();
    }
  }, []);

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
        setSpreadsheetData(response.data);
        cleanUp();
        setLoading(false);
        setFailed(false);
      })
      .catch(() => {
        setSpreadsheetData(null);
        setLoading(false);
        setFailed(true);
      });
  }

  function onWorkbookSaved() {
    cleanUp();
    backToUpload();
  }

  function backToUpload() {
    setSpreadsheetData(null);
    setFailed(false);
    setLoading(false);
    setPerformSave(false);
  }

  const failedMessage = failed ? (
    <div className="alert alert-danger">
      <DinaMessage id="workbookUploadFailure" />
    </div>
  ) : undefined;

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
            <SaveWorkbookProgress onWorkbookSaved={onWorkbookSaved} />
          ) : spreadsheetData ? (
            <WorkbookColumnMapping
              spreadsheetData={spreadsheetData}
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
