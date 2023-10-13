import { writeStorage } from "@rehooks/local-storage";
import { ApiClientContext, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useContext, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import {
  WorkbookColumnMapping,
  WorkbookJSON,
  WorkbookUpload
} from "../../components";
import { IFileWithMeta } from "../../components/object-store";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { BULK_EDIT_RESULT_IDS_KEY } from "../collection/material-sample/bulk-edit";

export function UploadWorkbookPage({ router }: WithRouterProps) {
  const { apiClient } = useContext(ApiClientContext);

  const [spreadsheetData, setSpreadsheetData] = useState<WorkbookJSON | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);

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
        setLoading(false);
        setFailed(false);
      })
      .catch(() => {
        setSpreadsheetData(null);
        setLoading(false);
        setFailed(true);
      });
  }

  function backToUpload() {
    setSpreadsheetData(null);
    setFailed(false);
    setLoading(false);
  }

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    writeStorage(
      BULK_EDIT_RESULT_IDS_KEY,
      samples.map((it) => it.id)
    );

    await router.push({
      pathname: "/collection/material-sample/bulk-result",
      query: { actionType: "created" }
    });
  }

  const failedMessage = failed ? (
    <div className="alert alert-danger">
      <DinaMessage id="workbookUploadFailure" />
    </div>
  ) : undefined;

  const buttonBar = !!spreadsheetData ? (
    <>
      <button onClick={backToUpload} className="btn btn-secondary">
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
          <DinaMessage id="cancelButtonText" />
        )}
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
          {spreadsheetData ? (
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
