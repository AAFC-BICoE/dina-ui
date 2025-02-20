import { applySourceFilteringString } from "common-ui/lib/list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { PersistedResource } from "kitsu";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import { MolecularAnalysisResult } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { DATA_EXPORT_QUERY_KEY, useApiClient } from "common-ui";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useLocalStorage from "@rehooks/local-storage";
import { useRouter } from "next/router";

export interface UseMolecularAnalysisExportAPIReturn {
  runSummaries: any[];
  setRunSummaries: Dispatch<SetStateAction<any[]>>;

  networkLoading: boolean;
  exportLoading: boolean;

  dataExportError: JSX.Element | undefined;

  performExport: (formik: any) => void;
}

export default function useMolecularAnalysisExportAPI(): UseMolecularAnalysisExportAPIReturn {
  const { apiClient, bulkGet } = useApiClient();
  const router = useRouter();

  // Run summaries loaded in from the elastic search query.
  const [runSummaries, setRunSummaries] = useState<any[]>([]);

  // If any errors occur, a JSX component of the error can be presented to the user.
  const [dataExportError, setDataExportError] = useState<JSX.Element>();

  // Loading specifically for the run item selection loading.
  const [networkLoading, setNetworkLoading] = useState(false);

  // Loading specifically for waiting for the export to be complete.
  const [exportLoading, setExportLoading] = useState(false);

  // Have the queries responsible for determining the number of attachments for each run item been ran.
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // ElasticSearch index name to be used for the export.
  const indexName = "dina_material_sample_index";

  /**
   * Initial loading of the page. Used to retrieve the run items based on the query object.
   */
  useEffect(() => {
    if (!queryObject) {
      router.push("/export/data-export/list");
    } else {
      setNetworkLoading(true);
      retrieveRunSummaries();
    }
  }, []);

  /**
   * Retrieve the attachments for the run summaries if loaded in.
   */
  useEffect(() => {
    async function waitForLoading() {
      await retrieveRunAttachments();
      await retrieveRunItemAttachments();

      setNetworkLoading(false);
    }

    if (runSummaries.length > 0 && !attachmentsLoaded) {
      setAttachmentsLoaded(true);
      waitForLoading();
    }
  }, [runSummaries]);

  /**
   * Using elasticsearch on the query being performed, retrieve all of the run summaries to be
   * exported.
   */
  async function retrieveRunSummaries() {
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
                // It exists already, so bundle the run items to the existing run.
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
      });
  }

  /**
   * Retrieves and links image attachments to the top-level run summaries.
   *
   * This function fetches attachments for each run summary in the `runSummaries` state.
   * It retrieves attachments directly associated with the molecular analysis runs themselves (top-level
   * attachments, not item-level attachments). The function then filters these attachments to
   * identify those that are images, extracts the relevant file identifiers (prioritizing
   * 'LARGE_IMAGE' derivatives if available), and updates the `runSummaries` state. Each run summary
   * in the state is updated with an `attachments` property, which is an array of file identifiers
   * for its image attachments.
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
    const metadataIds: string[] = molecularAnalysisRuns
      .flatMap((run) => run?.attachments?.map((attachment) => attachment.id))
      .filter((id): id is string => id !== undefined);

    if (metadataIds.length > 0) {
      const metadatas = await retrieveMetadata(metadataIds);

      // For each file identifier from the metadata, we need to link it to the run summary.
      runSummaries.forEach((_runSummary, index) => {
        const run = molecularAnalysisRuns[index];
        const currentRunFileIdentifiers: string[] = [];

        if (run?.attachments) {
          run.attachments.forEach((attachment) => {
            const metadata = metadatas.find(
              (meta) => meta.id === attachment.id
            );

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

  /**
   * Retrieves and links image attachments to run items within the run summaries.
   *
   * This function iterates through each run summary in the `runSummaries` state.
   * For each run summary, it fetches attachments for each run item (within `runSummaries.attributes.items`)
   * that has a associated `result`.  It then filters these attachments to identify image types,
   * extracts relevant file identifiers (prioritizing 'LARGE_IMAGE' derivatives), and
   * updates the `runSummaries` state.  Specifically, it adds an `attachments` array to each
   * run item object in the state, containing the file identifiers of its image attachments.
   */
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

        // Retrieve the metadata ids for all run items in this summary.
        const metadataIds: string[] = molecularAnalysisResults
          .flatMap((run) =>
            run?.attachments?.map((attachment) => attachment.id)
          )
          .filter((id): id is string => id !== undefined);

        // Using the metadata ids, retrieve the metadatas in a bulk get request.
        const metadatas = await retrieveMetadata(metadataIds);

        // Update runSummaries state
        setRunSummaries((currentRunSummaries) => {
          return currentRunSummaries.map((currentRunSummary) => {
            if (currentRunSummary.id === runSummary.id) {
              // Map over items to update the attachments for each item
              const updatedItems = currentRunSummary.attributes.items.map(
                (item) => {
                  // Find the corresponding molecularAnalysisResult for this item
                  const molecularAnalysisResult = molecularAnalysisResults.find(
                    (result) => result?.id === item?.result?.uuid
                  );

                  const currentItemFileIdentifiers: string[] = [];

                  if (molecularAnalysisResult?.attachments) {
                    molecularAnalysisResult.attachments.forEach(
                      (attachment) => {
                        const metadata = metadatas.find(
                          (meta) => meta.id === attachment.id
                        );
                        if (metadata && metadata.dcType === "IMAGE") {
                          let fileIdentifier: string | undefined;

                          if (metadata.derivatives) {
                            const largeImageDerivative =
                              metadata.derivatives.find(
                                (derivative) =>
                                  derivative.derivativeType === "LARGE_IMAGE"
                              );
                            fileIdentifier =
                              largeImageDerivative?.fileIdentifier;
                          }

                          // Otherwise, return original fileIdentifier from the metadata.
                          if (!fileIdentifier) {
                            fileIdentifier = metadata.fileIdentifier;
                          }

                          if (fileIdentifier) {
                            currentItemFileIdentifiers.push(fileIdentifier);
                          }
                        }
                      }
                    );
                  }

                  return {
                    ...item,
                    attachments: currentItemFileIdentifiers
                  };
                }
              );

              return {
                ...currentRunSummary,
                attributes: {
                  ...currentRunSummary.attributes,
                  items: updatedItems
                }
              };
            }
            return currentRunSummary;
          });
        });
      })
    );
  }

  /**
   * Retrieves metadata resources for a given array of metadata IDs.
   *
   * @param ids string uuids to be retrieved.
   * @returns Metadata objects.
   */
  async function retrieveMetadata(
    ids: string[]
  ): Promise<PersistedResource<Metadata>[]> {
    if (ids.length === 0) {
      return [];
    }

    const metadataPaths = ids.map((id) => `metadata/${id}?include=derivatives`);
    const metadataResponses: PersistedResource<Metadata>[] = await bulkGet(
      metadataPaths,
      {
        apiBaseUrl: "/objectstore-api"
      }
    );
    return metadataResponses;
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

  async function performExport(_formik) {
    setExportLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Retrieve options from the formik form.
    // const { name, includeQualityControls } = formik.values;

    setExportLoading(false);
  }

  return {
    runSummaries,
    setRunSummaries,
    networkLoading,
    exportLoading,
    dataExportError,
    performExport
  };
}
