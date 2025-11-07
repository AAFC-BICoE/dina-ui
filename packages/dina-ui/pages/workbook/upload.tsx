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
import Link from "next/link";
import { useLocalStorage } from "@rehooks/local-storage";
import { BULK_ADD_IDS_KEY } from "../object-store/upload";
import { FaArrowLeft, FaFileArrowDown } from "react-icons/fa6";

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

  const [bulkEditIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);

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

  const objectUploadMessage = bulkEditIds?.length ? (
    <div className="alert alert-info">
      <DinaMessage
        id="workbookUploadBulkEditInfoMessage"
        values={{ count: bulkEditIds.length }}
      />
    </div>
  ) : null;

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
    ) : (
      <div className="col-md-12 col-sm-12 d-flex">
        {bulkEditIds && bulkEditIds.length > 0 && (
          <Link
            href="/object-store/upload"
            className="btn btn-outline-secondary previous-button"
          >
            <FaArrowLeft className="me-2" />
            <DinaMessage id="goToThePreviousStep" />
          </Link>
        )}
        <Link href={`/workbook/generator`} className="btn btn-primary ms-auto">
          <FaFileArrowDown className="me-2" />
          <DinaMessage id="workbookGenerateTemplateTitle" />
        </Link>
      </div>
    );

  return (
    <PageLayout titleId="workbookGroupUploadTitle" buttonBarContent={buttonBar}>
      {loading === true ? (
        <LoadingSpinner loading={true} />
      ) : (
        <>
          {objectUploadMessage}
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
