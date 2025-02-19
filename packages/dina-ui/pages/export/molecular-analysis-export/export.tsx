import useLocalStorage from "@rehooks/local-storage";
import {
  BackButton,
  CheckBoxField,
  checkboxProps,
  CommonMessage,
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DinaForm,
  SubmitButton,
  TextField,
  useApiClient
} from "common-ui";
import { useSessionStorage } from "usehooks-ts";
import { useEffect, useState } from "react";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Spinner } from "react-bootstrap";
import { applySourceFilteringString } from "common-ui/lib/list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { PersistedResource } from "kitsu";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import { MolecularAnalysisResult } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";

export default function ExportMolecularAnalysisPage() {
  const { formatNumber } = useIntl();
  const { apiClient, bulkGet } = useApiClient();
  const router = useRouter();

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // ElasticSearch index name to be used for the export.
  const indexName = "dina_material_sample_index";

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  // Run summaries loaded in from the elastic search query.
  const [runSummaries, setRunSummaries] = useState<any[]>([]);

  const [dataExportError, setDataExportError] = useState<JSX.Element>();
  const [loading, setLoading] = useState(false);
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);

  /**
   * Initial loading of the page. Used to retrieve the run items based on the query object.
   */
  useEffect(() => {
    if (!queryObject) {
      router.push("/export/data-export/list");
    } else {
      retrieveRunItems();
    }
  }, []);

  /**
   * Retrieve the attachments for the run summaries if loaded in.
   */
  useEffect(() => {
    if (runSummaries.length > 0 && !attachmentsLoaded) {
      setAttachmentsLoaded(true);

      retrieveRunAttachments();
      retrieveRunItemAttachments();
    }
  }, [runSummaries]);

  async function retrieveRunItems() {
    setLoading(true);

    // Retrieve the run items based on the query object.
    let queryDSL = queryObject;
    queryDSL = applySourceFilteringString(queryDSL, [
      "included.id",
      "included.type",
      "included.attributes"
    ]);

    elasticSearchRequest(queryDSL)
      .then((result) => {
        const results = result?.hits.map((rslt) => {
          return {
            // Only include run-summary type includes.
            included: rslt._source?.included?.filter(
              (item) => item.type === "run-summary"
            )
          };
        });

        // Retrieve all of the run-summary includes
        const uniqueRunSummaries: any[] = [];
        results.forEach((result) => {
          if (result.included) {
            result.included.forEach((included) => {
              // Check if it's been already added by the id, only display unique run summaries.
              const existingRunSummary = uniqueRunSummaries.find(
                (r) => r.id === included.id
              );
              if (existingRunSummary) {
                const existingRunSummaryIndex =
                  uniqueRunSummaries.indexOf(existingRunSummary);
                uniqueRunSummaries[existingRunSummaryIndex].attributes.items = [
                  ...uniqueRunSummaries[existingRunSummaryIndex].attributes
                    .items,
                  ...included.attributes.items.map((item) => ({
                    ...item,
                    enabled: true,
                    attachments: []
                  }))
                ];
              } else {
                const newIncluded = {
                  ...included,
                  enabled: true,
                  attachments: [],
                  attributes: {
                    ...included.attributes,
                    items: included.attributes.items.map((item) => ({
                      ...item,
                      enabled: true,
                      attachments: []
                    }))
                  }
                };

                uniqueRunSummaries.push(newIncluded);
              }
            });
          }
        });

        setRunSummaries(uniqueRunSummaries);
      })
      .catch((elasticSearchError) => {
        // Todo - add error handling.
        console.error(elasticSearchError);
      })
      .finally(() => {
        // No matter the end result, loading should stop.
        setLoading(false);
      });
  }

  /**
   * Retrieve the attachments for the run.
   */
  async function retrieveRunAttachments() {
    // First, retrieve the top level attachments for the runs.
    const attachmentPaths = runSummaries.map((runSummary) => {
      return "molecular-analysis-run/" + runSummary.id + "?include=attachments";
    });

    // Retrieve the attachments for the runs.
    const molecularAnalysisRuns: PersistedResource<MolecularAnalysisRun>[] =
      await bulkGet(attachmentPaths, {
        apiBaseUrl: "/seqdb-api"
      });

    // Now that we have the metadatas, we need to do a request to retrieve all the metadatas.
    const metadataIds = molecularAnalysisRuns
      .flatMap((run) => run?.attachments?.map((attachment) => attachment.id))
      .filter((id) => id !== undefined);

    if (metadataIds.length > 0) {
      const metadatas = await retrieveMetadata(metadataIds);

      // Create a map of metadataId to metadata for efficient lookup
      const metadataMap = new Map(
        metadatas.map((metadata) => [metadata.id, metadata])
      );

      // For each file identifier from the metadata, we need to link it to the run summary.
      runSummaries.forEach((_runSummary, index) => {
        const run = molecularAnalysisRuns[index];
        const currentRunFileIdentifiers: string[] = [];

        if (run?.attachments) {
          run.attachments.forEach((attachment) => {
            const metadata = metadataMap.get(attachment.id); // Retrieve metadata from the map

            if (metadata) {
              if (metadata.dcType === "IMAGE") {
                let fileIdentifier;
                // If image has derivative, return large image derivative fileIdentifier if present
                if (metadata.derivatives) {
                  const largeImageDerivative = metadata.derivatives.find(
                    (derivative) => derivative.derivativeType === "LARGE_IMAGE"
                  );
                  fileIdentifier = largeImageDerivative?.fileIdentifier;
                }

                // Otherwise, return original fileIdentifier
                if (!fileIdentifier) {
                  fileIdentifier = metadata.fileIdentifier;
                }

                // Add it to the list of current run file identifiers.
                if (fileIdentifier) {
                  currentRunFileIdentifiers.push(fileIdentifier);
                }
              }
            }
          });

          // Update the run summaries state with the file identifiers.
          setRunSummaries(
            runSummaries.map((runSummary, runIndex) => {
              if (runIndex === index) {
                return {
                  ...runSummary,
                  attachments: currentRunFileIdentifiers
                };
              }
              return runSummary;
            })
          );
        }
      });
    }
  }

  async function retrieveRunItemAttachments() {
    // Loop through each run summary.
    await Promise.all(
      runSummaries.map(async (runSummary) => {
        // Generate a list of molecular analysis result ids to retrieve the attachments for.
        const attachmentPaths = runSummary.attributes.items
          .filter((item) => item.result !== null)
          .map(
            (item) =>
              "molecular-analysis-result/" +
              item.result.uuid +
              "?include=attachments"
          );

        // Retrieve the attachments for the run items.
        const molecularAnalysisResults: PersistedResource<MolecularAnalysisResult>[] =
          await bulkGet(attachmentPaths, {
            apiBaseUrl: "/seqdb-api"
          });

        // Retrieve the metadata ids for the run items.
        const _metadataIds = molecularAnalysisResults
          .flatMap((run) =>
            run?.attachments?.map((attachment) => attachment.id)
          )
          .filter((id) => id !== undefined);

        // Loop through each item in the run summary that has a result.
        runSummary.attributes.items
          .filter((item) => item.result !== null)
          .forEach((_item) => {
            // todo
          });
      })
    );
  }

  async function retrieveMetadata(
    ids: string[]
  ): Promise<PersistedResource<Metadata>[]> {
    const metadataPaths = ids.map((id) => `metadata/${id}?include=derivatives`);
    const metadataResponses: PersistedResource<Metadata>[] = await bulkGet(
      metadataPaths,
      {
        apiBaseUrl: "/objectstore-api"
      }
    );
    return metadataResponses;
  }

  async function exportData(_formik) {
    setLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Retrieve options from the formik form.
    // const { name, includeQualityControls } = formik.values;
  }

  /**
   * Asynchronous POST request for elastic search. Used to retrieve elastic search results against
   * the indexName in the prop.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
  async function elasticSearchRequest(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.hits;
  }

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
                {loading ? (
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
                    disabled={loading}
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
                    disabled: loading,
                    onClick: () => {
                      exportData(formik);
                    }
                  })}
                >
                  {loading ? (
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
