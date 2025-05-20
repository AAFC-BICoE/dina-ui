import {
  BackButton,
  checkboxProps,
  DinaForm,
  LoadingSpinner,
  MAX_OBJECT_EXPORT_TOTAL,
  SubmitButton,
  TextField
} from "common-ui";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card } from "react-bootstrap";
import useMolecularAnalysisExportAPI from "../../../components/export/useMolecularAnalysisExportAPI";
import React from "react";

export default function ExportMolecularAnalysisPage() {
  const router = useRouter();

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // Hook responsible for performing all the network calls required for retriving the run and run items.
  const {
    runSummaries,
    setRunSummaries,
    totalAttachments,
    loadQualityControls,
    setLoadQualityControls,
    networkLoading,
    exportLoading,
    dataExportError,
    performExport
  } = useMolecularAnalysisExportAPI();

  const disableObjectExportButton =
    exportLoading ||
    networkLoading ||
    totalAttachments === 0 ||
    totalAttachments > MAX_OBJECT_EXPORT_TOTAL;

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

        <div className="col-md-12">
          <h4 className="mt-3">
            <DinaMessage id="runItemSelection" />
          </h4>
          <Card>
            <Card.Body>
              <div className="row">
                {networkLoading ? (
                  <LoadingSpinner loading={true} additionalClassNames="ms-3" />
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
                              {runSummary?.attachments?.length !== 0 && (
                                <span className="badge bg-secondary ms-2">
                                  <DinaMessage
                                    id="numberOfAttachments"
                                    values={{
                                      totalAttachments:
                                        runSummary?.attachments?.length
                                    }}
                                  />
                                </span>
                              )}
                            </h5>
                          </div>
                          {runSummary?.attributes?.items?.map(
                            (item, itemIndex) => {
                              if (
                                item.isQualityControl &&
                                !loadQualityControls
                              ) {
                                return (
                                  <React.Fragment
                                    key={itemIndex}
                                  ></React.Fragment>
                                );
                              }

                              return (
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
                                    {item?.genericMolecularAnalysisItemSummary
                                      ?.name ?? (
                                      <i style={{ color: "gray" }}>
                                        Empty Name
                                      </i>
                                    )}

                                    {/* Total Attachments */}
                                    {item?.attachments?.length !== 0 && (
                                      <span className="badge bg-secondary ms-2">
                                        <DinaMessage
                                          id="numberOfAttachments"
                                          values={{
                                            totalAttachments:
                                              item?.attachments?.length
                                          }}
                                        />
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </>
                      );
                    })}
                    <p className="mt-4 mb-0">
                      <strong>
                        <DinaMessage id="totalAttachments" />
                      </strong>
                      {" " + totalAttachments}
                    </p>
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
                  disabled={exportLoading}
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
                  disabled={exportLoading}
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
                  <div>
                    <strong>
                      <DinaMessage id="field_includeQualityControls" />
                    </strong>
                  </div>
                  <input
                    type="checkbox"
                    name="includeQualityControls"
                    style={{
                      height: "30px",
                      width: "30px",
                      marginTop: "8px"
                    }}
                    disabled={exportLoading}
                    checked={loadQualityControls}
                    onChange={() => setLoadQualityControls((prev) => !prev)}
                  />
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="d-flex">
              <div className="me-auto">
                <SubmitButton
                  buttonProps={(formik) => ({
                    style: { width: "8rem" },
                    disabled: disableObjectExportButton,
                    onClick: () => {
                      performExport(formik);
                    }
                  })}
                >
                  {exportLoading ? (
                    <LoadingSpinner
                      loading={true}
                      additionalClassNames="spinner-border-sm"
                    />
                  ) : (
                    <DinaMessage id="exportButtonText" />
                  )}
                </SubmitButton>
              </div>
            </Card.Footer>
          </Card>
        </div>
        <div className="mt-3">{dataExportError}</div>
      </DinaForm>
    </PageLayout>
  );
}
