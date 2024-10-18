import { ApiClientContext, LoadingSpinner } from "common-ui";
import { withRouter } from "next/router";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { SaveWorkbookProgress } from "packages/dina-ui/components/workbook/SaveWorkbookProgress";
import { useContext, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import {
  WorkbookColumnMapping,
  WorkbookConfirmation,
  WorkbookUpload,
  trimSpace,
  useWorkbookContext
} from "../../components";
import { IFileWithMeta } from "../../components/object-store";
import { DinaMessage } from "../../intl/dina-ui-intl";

export function UploadWorkbookPage() {
  const { apiClient } = useContext(ApiClientContext);
  const {
    workbookResources,
    status,
    reset,
    spreadsheetData,
    uploadWorkbook,
    sourceSet,
    group,
    resourcesUpdatedCount
  } = useWorkbookContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);

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
      .post("/objectstore-api/workbook/conversion", formData)
      .then((response) => {
        uploadWorkbook(trimSpace(response.data));
        setLoading(false);
        setFailed(false);
      })
      .catch(() => {
        setLoading(false);
        setFailed(true);
      });
  }

  /**
   * Return to the upload page.
   * @param resetCompleted If true, the completed state is returned to false.
   */
  function backToUpload() {
    setFailed(false);
    setLoading(false);
    setPerformSave(false);
    reset();
  }

  function preventRendering() {
    setRedirecting(true);
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

  function isThereACompletedUpload(): boolean {
    return (
      redirecting ||
      (workbookResources &&
        workbookResources.length > 0 &&
        status === "FINISHED")
    );
  }

  const buttonBar =
    !isThereAnActiveUpload() &&
    !isThereACompletedUpload() &&
    !!spreadsheetData ? (
      <>
        <div className="col-md-6 col-sm-12">
          <Button
            variant={"secondary"}
            style={{ width: "10rem" }}
            onClick={backToUpload}
          >
            <DinaMessage id="cancelButtonText" />
          </Button>
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
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
        </div>
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
              onWorkbookCanceled={backToUpload}
              onWorkbookFailed={backToUpload}
            />
          ) : isThereACompletedUpload() ? (
            <WorkbookConfirmation
              totalWorkbookResourcesCount={workbookResources.length}
              sourceSetValue={sourceSet ?? ""}
              groupUsed={group ?? ""}
              onWorkbookReset={backToUpload}
              preventRendering={preventRendering}
              resourcesUpdatedCount={resourcesUpdatedCount}
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
