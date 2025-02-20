import {
  BackButton,
  CheckBoxField,
  checkboxProps,
  CommonMessage,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DinaForm,
  SubmitButton,
  TextField
} from "common-ui";
import { useSessionStorage } from "usehooks-ts";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Spinner } from "react-bootstrap";
import useMolecularAnalysisExportAPI from "../../../components/export/useMolecularAnalysisExportAPI";

export default function ExportMolecularAnalysisPage() {
  const { formatNumber } = useIntl();
  const router = useRouter();

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  // Hook responsible for performing all the network calls required for retriving the run and run items.
  const {
    runSummaries,
    setRunSummaries,
    networkLoading,
    exportLoading,
    dataExportError,
    performExport
  } = useMolecularAnalysisExportAPI();

  const LoadingSpinner = (
    <>
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
      <span className="visually-hidden">
        <DinaMessage id="loadingSpinner" />
      </span>
    </>
  );

  return (
    <PageLayout
      titleId="molecularAnalysisExport"
      buttonBarContent={
        <>
          <div className="col-md-6 col-sm-12 mt-2">
            <BackButton
              className="me-auto"
              entityLink={entityLink}
              byPassView={true}
            />
          </div>
          <div className="col-md-6 col-sm-12 d-flex">
            <Link href={`/export/data-export/list?entityLink=${entityLink}`}>
              <a className="btn btn-primary ms-auto">
                <DinaMessage id="viewExportHistoryButton" />
              </a>
            </Link>
          </div>
        </>
      }
    >
      <DinaForm initialValues={{}}>
        {dataExportError}

        <CommonMessage
          id="tableTotalCount"
          values={{ totalCount: formatNumber(totalRecords ?? 0) }}
        />

        <div className="col-md-12">
          <h4 className="mt-3">
            <DinaMessage id="runItemSelection" />
          </h4>
          <Card>
            <Card.Body>
              <div className="row">
                {networkLoading ? (
                  LoadingSpinner
                ) : (
                  <>
                    {runSummaries.map((runSummary, index) => {
                      return (
                        <>
                          <div
                            key={index}
                            className="d-flex align-items-center mt-3"
                          >
                            <input
                              type="checkbox"
                              name={`runSelected[${index}]`}
                              checked={runSummary?.enabled}
                              style={checkboxProps.style}
                              onChange={() => {
                                runSummary.enabled = !runSummary.enabled;
                                setRunSummaries([...runSummaries]);
                              }}
                            />
                            <h5 className="ms-2 mb-0">
                              {/* Run Name */}
                              {runSummary?.attributes?.name}

                              {/* Total Attachments */}
                              <span className="badge bg-secondary ms-2">
                                {runSummary?.attachments?.length}
                                {" attachments"}
                              </span>
                            </h5>
                          </div>
                          {runSummary?.attributes?.items?.map(
                            (item, itemIndex) => (
                              <div
                                key={itemIndex}
                                style={{ marginLeft: "30px" }}
                                className="d-flex align-items-center"
                              >
                                <input
                                  type="checkbox"
                                  name={`runItemSelected[${itemIndex}]`}
                                  checked={
                                    runSummary.enabled ? item?.enabled : false
                                  }
                                  disabled={!runSummary.enabled}
                                  style={checkboxProps.style}
                                  onChange={() => {
                                    item.enabled = !item.enabled;
                                    setRunSummaries([...runSummaries]);
                                  }}
                                />
                                <span className="ms-2 mb-0">
                                  {/* Run Item Name */}
                                  {
                                    item?.genericMolecularAnalysisItemSummary
                                      ?.name
                                  }

                                  {/* Total Attachments */}
                                  <span className="badge bg-secondary ms-2">
                                    {item?.attachments?.length}
                                    {" attachments"}
                                  </span>
                                </span>
                              </div>
                            )
                          )}
                        </>
                      );
                    })}
                  </>
                )}
              </div>
            </Card.Body>
            <Card.Footer className="d-flex">
              <div className="me-auto">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    runSummaries.forEach((runSummary) => {
                      runSummary.enabled = true;
                      runSummary.attributes.items.forEach((item) => {
                        item.enabled = true;
                      });
                    });
                    setRunSummaries([...runSummaries]);
                  }}
                >
                  <DinaMessage id="selectAll" />
                </button>
                <button
                  className="btn btn-primary ms-2"
                  onClick={() => {
                    runSummaries.forEach((runSummary) => {
                      runSummary.enabled = false;
                      runSummary.attributes.items.forEach((item) => {
                        item.enabled = false;
                      });
                    });
                    setRunSummaries([...runSummaries]);
                  }}
                >
                  <DinaMessage id="deselectAll" />
                </button>
              </div>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-12">
          <h4 className="mt-3">
            <DinaMessage id="settingLabel" />
          </h4>
          <Card>
            <Card.Body>
              <div className="row">
                <div className="col-md-4">
                  <TextField
                    name={"name"}
                    customName="exportName"
                    disabled={exportLoading}
                  />
                </div>
                <div className="col-md-4">
                  <CheckBoxField
                    name="includeQualityControls"
                    overridecheckboxProps={{
                      style: {
                        height: "30px",
                        width: "30px"
                      }
                    }}
                  />
                </div>
                <div className="col-md-4">
                  <CheckBoxField
                    name="createFoldersForBlankRunItems"
                    overridecheckboxProps={{
                      style: {
                        height: "30px",
                        width: "30px"
                      }
                    }}
                  />
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="d-flex">
              <div className="me-auto">
                <SubmitButton
                  buttonProps={(formik) => ({
                    style: { width: "8rem" },
                    disabled: exportLoading,
                    onClick: () => {
                      performExport(formik);
                    }
                  })}
                >
                  {exportLoading ? (
                    LoadingSpinner
                  ) : (
                    <DinaMessage id="exportButtonText" />
                  )}
                </SubmitButton>
              </div>
            </Card.Footer>
          </Card>
        </div>
      </DinaForm>
    </PageLayout>
  );
}
