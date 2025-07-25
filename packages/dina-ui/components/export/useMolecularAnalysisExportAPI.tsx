import {
  applyPagination,
  applySourceFilteringString
} from "common-ui/lib/list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { PersistedResource } from "kitsu";
import { Metadata, ObjectExport } from "packages/dina-ui/types/objectstore-api";
import { MolecularAnalysisResult } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import {
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  filterBy,
  getExport,
  MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT,
  MAX_OBJECT_EXPORT_TOTAL,
  useApiClient
} from "common-ui";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useState
} from "react";
import useLocalStorage from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { Alert } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import { ResourceIdentifierObject } from "jsonapi-typescript";

export interface UseMolecularAnalysisExportAPIReturn {
  runSummaries: any[];
  setRunSummaries: Dispatch<SetStateAction<any[]>>;

  totalAttachments: number;

  loadQualityControls: boolean;
  setLoadQualityControls: Dispatch<SetStateAction<boolean>>;

  networkLoading: boolean;
  exportLoading: boolean;

  dataExportError: ReactNode | undefined;

  performExport: (formik: any) => void;
}

export default function useMolecularAnalysisExportAPI(): UseMolecularAnalysisExportAPIReturn {
  const { apiClient, bulkGet, save } = useApiClient();
  const router = useRouter();

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  // Run summaries loaded in from the elastic search query.
  const [runSummaries, setRunSummaries] = useState<any[]>([]);

  // Toggle the user can choose to select if quality control attachments are included.
  const [loadQualityControls, setLoadQualityControls] =
    useState<boolean>(false);

  // If any errors occur, a JSX component of the error can be presented to the user.
  const [dataExportError, setDataExportError] = useState<ReactNode>();

  // Loading specifically for the run item selection loading.
  const [networkLoading, setNetworkLoading] = useState(true);

  // Loading specifically for waiting for the export to be complete.
  const [exportLoading, setExportLoading] = useState(false);

  // Have the queries responsible for determining the number of attachments for each run item been ran.
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);

  // Have the quality controls been loaded already, do not run it again if it is true.
  const [qualityControlsLoaded, setQualityControlsLoaded] = useState(false);

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // ElasticSearch index name to be used for the export.
  const indexName = "dina_material_sample_index";

  /**
   * Initial loading of the page. Used to retrieve the run items based on the query object.
   */
  useEffect(() => {
    if (totalRecords > MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT) {
      setNetworkLoading(true);
      setDataExportError(
        <Alert variant="danger" className="mb-2">
          <DinaMessage
            id="molecularAnalysisExportMaxMaterialSampleError"
            values={{
              limit: MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT
            }}
          />
        </Alert>
      );
      return;
    }

    if (!queryObject || totalRecords === 0) {
      router.push("/export/data-export/list");
    } else {
      setNetworkLoading(true);
      setAttachmentsLoaded(false);
      retrieveRunSummaries();
    }
  }, []);

  /**
   * Retrieve the attachments for the run summaries if loaded in.
   */
  useEffect(() => {
    async function waitForLoading() {
      await retrieveRunAndItemAttachments();
      setNetworkLoading(false);
    }

    if (runSummaries.length > 0 && !attachmentsLoaded) {
      setAttachmentsLoaded(true);
      waitForLoading();
    } else {
      setNetworkLoading(false);
    }
  }, [runSummaries]);

  /**
   * Use effect responsible for loading in the quality control attachments.
   */
  useEffect(() => {
    if (loadQualityControls) {
      if (!qualityControlsLoaded) {
        setQualityControlsLoaded(true);
        retrieveQualityControlAttachments();
      } else {
        changeQualityControlEnabled(true);
      }
    } else {
      if (qualityControlsLoaded) {
        changeQualityControlEnabled(false);
      }
    }
  }, [loadQualityControls]);

  /**
   * Each time the runSummaries state changes (which can occur when loading and user selects a checkbox.)
   * this useMemo will determine the total number of attachments.
   */
  const totalAttachments = useMemo(() => {
    let count = 0;

    // Count attachments for runs
    if (runSummaries && runSummaries.length > 0) {
      runSummaries.forEach((runSummary) => {
        if (runSummary.enabled) {
          if (runSummary.attachments && runSummary.attachments.length > 0) {
            count += runSummary.attachments.length;
          }
        }
      });
    }

    // Count attachments for run items
    if (runSummaries && runSummaries.length > 0) {
      runSummaries.forEach((runSummary) => {
        if (
          runSummary.attributes &&
          runSummary.attributes.items &&
          runSummary.enabled
        ) {
          runSummary.attributes.items.forEach((item) => {
            if (item.enabled) {
              if (item.attachments && item.attachments.length > 0) {
                count += item.attachments.length;
              }
            }
          });
        }
      });
    }

    if (count > MAX_OBJECT_EXPORT_TOTAL) {
      setDataExportError(
        <Alert variant="danger" className="mb-2">
          <DinaMessage
            id="molecularAnalysisExportMaxObjectError"
            values={{ limit: MAX_OBJECT_EXPORT_TOTAL }}
          />
        </Alert>
      );
    }

    return count;
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
    queryDSL = applyPagination(
      queryDSL,
      MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT,
      0
    );

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
                    isQualityControl: false,
                    attachments: []
                  }))
                ];
              } else {
                const newIncluded = {
                  ...included,
                  enabled: true,
                  isQualityControl: false,
                  attachments: [],
                  attributes: {
                    ...included.attributes,
                    items: included.attributes.items.map((item) => ({
                      ...item,
                      enabled: true,
                      isQualityControl: false,
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
        console.error(elasticSearchError);
        setDataExportError(
          <Alert variant="danger" className="mb-2">
            {elasticSearchError}
          </Alert>
        );
      });
  }

  /**
   * Extracts file identifiers from a list of attachments.
   *
   * Images have a special edge case where if a LARGE_IMAGE derivative exists, it's preferred over
   * the original file identifier. Other file types will just always use the metadata file
   * identifier.
   *
   * @param attachments - Array of attachment objects.
   * @param metadataMap - Map containing metadata for attachments.
   * @returns Array of file identifiers.
   */
  function getFileIdentifiers(
    attachments: ResourceIdentifierObject[],
    metadataMap: Map<string, PersistedResource<Metadata>>
  ) {
    const fileIdentifiers: string[] = [];
    attachments.forEach((attachment) => {
      const metadata = metadataMap.get(attachment.id);
      if (metadata?.dcType === "IMAGE") {
        const fileIdentifier =
          metadata.derivatives?.find((d) => d.derivativeType === "LARGE_IMAGE")
            ?.fileIdentifier || metadata.fileIdentifier;
        if (fileIdentifier) {
          fileIdentifiers.push(fileIdentifier);
        }
      } else if (metadata?.fileIdentifier) {
        fileIdentifiers.push(metadata.fileIdentifier);
      }
    });
    return fileIdentifiers;
  }

  /**
   * This function will fetch attachments for both top-level run summaries and individual run items
   * within them in. It retrieves attachments for both `molecular-analysis-run` and
   * `molecular-analysis-result` resources.
   *
   * The function performs the following steps:
   *
   * 1. Generates API paths for fetching attachments for both run summaries and run items.
   * 2. Uses `bulkGet` to retrieve attachments for molecular analysis runs and molecular analysis
   *    results separately.
   * 3. Collects all metadata IDs from the attachments of both types of resources.
   * 4. Retrieves all metadata objects in a single bulk request using `retrieveMetadata`.
   * 5. Updates the `runSummaries` state, adding `attachments` properties to both run summaries
   *    and their items with filtered image file identifiers.
   */
  async function retrieveRunAndItemAttachments() {
    // 1. Generate API paths for both run summaries and run items.
    const runAttachmentPaths = runSummaries.map((runSummary) => {
      return (
        "molecular-analysis-run/" +
        runSummary.id +
        "?include=attachments&page[limit]=1000"
      );
    });

    const itemAttachmentPaths = runSummaries.flatMap((runSummary) =>
      runSummary.attributes.items
        .filter((item) => item?.result?.uuid)
        .map(
          (item) =>
            "molecular-analysis-result/" +
            item.result.uuid +
            "?include=attachments&page[limit]=1000"
        )
    );

    // 2. Retrieve attachments using bulkGet for both run summaries and run items.
    const molecularAnalysisRuns: PersistedResource<MolecularAnalysisRun>[] =
      await bulkGet(runAttachmentPaths, {
        apiBaseUrl: "/seqdb-api"
      });

    const molecularAnalysisResults: PersistedResource<MolecularAnalysisResult>[] =
      await bulkGet(itemAttachmentPaths, {
        apiBaseUrl: "/seqdb-api"
      });

    // 3. Collect metadata IDs from both run and item attachments.
    const metadataIds: string[] = [
      ...molecularAnalysisRuns
        .flatMap((run) => run?.attachments?.map((attachment) => attachment.id))
        .filter((id): id is string => id !== undefined),
      ...molecularAnalysisResults
        .flatMap((result) =>
          result?.attachments?.map((attachment) => attachment.id)
        )
        .filter((id): id is string => id !== undefined)
    ];

    // 4. Retrieve all metadatas in a single bulk request.
    const metadatas =
      metadataIds.length > 0 ? await retrieveMetadata(metadataIds) : [];
    const metadataMap = new Map(
      metadatas.map((metadata) => [metadata.id, metadata])
    );

    // 5. Update runSummaries state to include attachments for both runs and items.
    setRunSummaries((currentRunSummaries) => {
      return currentRunSummaries.map((currentRunSummary, runSummaryIndex) => {
        const molecularAnalysisRun = molecularAnalysisRuns[runSummaryIndex];
        const currentRunFileIdentifiers = molecularAnalysisRun?.attachments
          ? getFileIdentifiers(molecularAnalysisRun.attachments, metadataMap)
          : [];

        // Update items within the current run summary
        const updatedItems = currentRunSummary.attributes.items.map((item) => {
          const molecularAnalysisResult = molecularAnalysisResults.find(
            (result) => result?.id === item.result?.uuid
          );
          const currentItemFileIdentifiers =
            molecularAnalysisResult?.attachments
              ? getFileIdentifiers(
                  molecularAnalysisResult.attachments as ResourceIdentifierObject[],
                  metadataMap
                )
              : [];

          return {
            ...item,
            attachments: currentItemFileIdentifiers
          };
        });

        return {
          ...currentRunSummary,
          attachments: currentRunFileIdentifiers,
          attributes: {
            ...currentRunSummary.attributes,
            items: updatedItems
          }
        };
      });
    });
  }

  /**
   * Performs all of the requests required for retrieving the quality control attachments.
   *
   * Function performs the following steps:
   *
   * 1. Using all of the run summary ids, generate a single request to return all of the quality
   *    control run items.
   * 2. Retrieve all of the result ids from the run items and perform a single request to
   *    retrieve them.
   * 3. Retrieve the quality controls associated with the quality control items, which contains
   *    the name and type for packaging the zip.
   * 4. Using the results found, retrieve all of the metadata to get the file identifiers and
   *    derivatives.
   * 5. Set the run summaries to include the quality control attachments so the user can see and
   *    select which to include in the export. Note that the LARGE_IMAGE derivative is always
   *    preferred. Images are also the currently only accepted type.
   */
  async function retrieveQualityControlAttachments() {
    setNetworkLoading(true);

    if (runSummaries.length > 0) {
      const runIds = runSummaries.map((run) => run.id);

      // 1. Using all of the run summary ids, generate a single request to return all of the quality
      // control run items.
      const { data: newQualityControlItems } = await apiClient.get<
        MolecularAnalysisRunItem[]
      >("seqdb-api/molecular-analysis-run-item", {
        filter: filterBy([], {
          extraFilters: [
            { selector: "run.uuid", comparison: "=in=", arguments: runIds },
            {
              selector: "usageType",
              comparison: "==",
              arguments: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
            }
          ]
        })(""),
        include: "result,run",
        page: { limit: 100 }
      });

      // Only continue if run items exist, if none then nothing to load.
      if (newQualityControlItems && newQualityControlItems.length > 0) {
        // 2. Retrieve all of the result ids from the run items and perform a single request to
        // retrieve them.
        const resultIds: string[] = newQualityControlItems
          .filter((item) => item?.result?.id)
          .map((item) => item?.result?.id ?? "");
        const { data: qualityControlResultsResponse } = await apiClient.get<
          MolecularAnalysisResult[]
        >("seqdb-api/molecular-analysis-result", {
          filter: filterBy([], {
            extraFilters: [
              { selector: "uuid", comparison: "=in=", arguments: resultIds }
            ]
          })(""),
          include: "attachments",
          page: { limit: 100 }
        });

        // 3. Also retrieve the quality controls associated with the quality control items, this
        // contains the name and type for packaging the zip.
        const { data: qualityControlNamesResponse } = await apiClient.get<
          QualityControl[]
        >("seqdb-api/quality-control", {
          filter: filterBy([], {
            extraFilters: [
              {
                selector: "molecularAnalysisRunItem.uuid",
                comparison: "=in=",
                arguments: newQualityControlItems.map((item) => item?.id ?? "")
              }
            ]
          })(""),
          include: "molecularAnalysisRunItem",
          page: { limit: 100 }
        });

        // 4. Using the results found, retrieve all of the metadata to get the file identifiers and
        // derivatives.
        const metadataIds: string[] = qualityControlResultsResponse.flatMap(
          (result) =>
            result.attachments.map((attachment) => attachment?.id ?? "")
        );
        const metadatas =
          metadataIds.length > 0 ? await retrieveMetadata(metadataIds) : [];
        const metadataMap = new Map<string, PersistedResource<Metadata>>(
          metadatas.map((metadata) => [metadata.id, metadata])
        );

        const qualityControlNamesMap = new Map<string, string>(
          qualityControlNamesResponse.map((qc) => [
            qc?.molecularAnalysisRunItem?.id ?? "",
            qc.name ?? ""
          ])
        );

        // 5. Taking all the requests, set the run summaries to include the quality control
        // attachments so the user can see and select which to include in the export.
        // Please note the LARGE_IMAGE derivative is always preferred.
        setRunSummaries((currentRunSummaries) => {
          return currentRunSummaries.map((currentRunSummary) => {
            const qualityControlItemsForRun = newQualityControlItems.filter(
              (item) => item?.run?.id === currentRunSummary.id
            );

            const generatedQualityControlItems = qualityControlItemsForRun.map(
              (qcItem) => {
                const molecularAnalysisResult =
                  qualityControlResultsResponse.find(
                    (result) => result.id === qcItem?.result?.id
                  );
                const currentItemFileIdentifiers =
                  molecularAnalysisResult?.attachments
                    ? getFileIdentifiers(
                        molecularAnalysisResult.attachments as ResourceIdentifierObject[],
                        metadataMap
                      )
                    : [];

                return {
                  uuid: qcItem.id,
                  name: qualityControlNamesMap.get(qcItem?.id ?? "") || "",
                  enabled: true,
                  isQualityControl: true,
                  genericMolecularAnalysisItemSummary: {
                    name: qualityControlNamesMap.get(qcItem?.id ?? "") || ""
                  },
                  attachments: currentItemFileIdentifiers,
                  result: qcItem.result,
                  molecularAnalysisRunItem: qcItem
                };
              }
            );

            return {
              ...currentRunSummary,
              attributes: {
                ...currentRunSummary.attributes,
                items: [
                  ...currentRunSummary.attributes.items,
                  ...generatedQualityControlItems
                ]
              }
            };
          });
        });
      }
    }

    setNetworkLoading(false);
  }

  /**
   * Disables all quality control items in the run summaries items.
   */
  async function changeQualityControlEnabled(enabled: boolean) {
    setRunSummaries((currentRunSummaries) => {
      return currentRunSummaries.map((currentRunSummary) => {
        const updatedItems = currentRunSummary.attributes.items.map((item) => {
          if (item.isQualityControl === true) {
            return {
              ...item,
              enabled: enabled
            };
          }
          return item;
        });

        return {
          ...currentRunSummary,
          attributes: {
            ...currentRunSummary.attributes,
            items: updatedItems
          }
        };
      });
    });
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

    const metadataPaths = ids.map(
      (id) => `metadata/${id}?include=derivatives&page[limit]=1000`
    );
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

  async function performExport(formik) {
    setExportLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Retrieve options from the formik form.
    const { name } = formik.values;

    // Generate fileIdentifiers array based on enabled runs and run items.
    const fileIdentifiers: string[] = [];

    // Generate the file structure based on the enabled runs and run items.
    const exportLayout = new Map<string, string[]>();

    // Folders must be unique or everything will be clumped into one folder.
    const generateUniqueFolderName = (folderName: string) => {
      let uniqueFolderName = folderName;
      let counter = 2;
      while (exportLayout.has(uniqueFolderName)) {
        uniqueFolderName = `${folderName}(${counter})`;
        counter++;
      }
      return uniqueFolderName;
    };

    if (runSummaries && runSummaries.length > 0) {
      runSummaries.forEach((runSummary) => {
        if (!runSummary.enabled) return;

        const baseFolder = generateUniqueFolderName(runSummary.attributes.name);

        const runAttachments: string[] = [];
        const itemsAttachments: string[] = [];
        const qaAttachments: string[] = [];

        // Collect run-level attachments (go into "run1/")
        if (runSummary.attachments?.length > 0) {
          runSummary.attachments.forEach((attachmentFileIdentifier) => {
            fileIdentifiers.push(attachmentFileIdentifier);
            runAttachments.push(attachmentFileIdentifier);
          });
        }

        // Collect enabled item attachments
        if (runSummary.attributes?.items) {
          runSummary.attributes.items.forEach((item) => {
            if (item.enabled && item.attachments?.length > 0) {
              if (!item.isQualityControl) {
                item.attachments.forEach((itemFileIdentifier) => {
                  fileIdentifiers.push(itemFileIdentifier);
                  itemsAttachments.push(itemFileIdentifier);
                });
              } else {
                item.attachments.forEach((itemFileIdentifier) => {
                  fileIdentifiers.push(itemFileIdentifier);
                  qaAttachments.push(itemFileIdentifier);
                });
              }
            }
          });
        }

        // Add folders to exportLayout
        if (runAttachments.length > 0) {
          exportLayout.set(`${baseFolder}/`, runAttachments);
        }
        if (itemsAttachments.length > 0) {
          exportLayout.set(`${baseFolder}/results`, itemsAttachments);
        }
        if (qaAttachments.length > 0) {
          exportLayout.set(`${baseFolder}/controls`, qaAttachments);
        }
      });
    } else {
      setExportLoading(false);
      return;
    }

    // Check if any duplicates were found in the file identifiers list.
    if (fileIdentifiers.length !== new Set(fileIdentifiers).size) {
      setDataExportError(
        <Alert variant="danger" className="mb-2">
          Duplicate files detected in the export. Please ensure that each file
          is unique and try again.
        </Alert>
      );
      setExportLoading(false);
      return;
    }
    const objectExportSaveArg = {
      resource: {
        type: "object-export",
        fileIdentifiers,
        exportLayout: Object.fromEntries(exportLayout),
        name
      },
      type: "object-export"
    };

    try {
      const objectExportResponse = await save<ObjectExport>(
        [objectExportSaveArg],
        {
          apiBaseUrl: "/objectstore-api"
        }
      );
      await getExport(
        objectExportResponse,
        setExportLoading,
        setDataExportError,
        apiClient,
        formik
      );
    } catch (e) {
      setDataExportError(
        <Alert variant="danger" className="mb-2">
          {e?.message ?? e.toString()}
        </Alert>
      );
    }

    setExportLoading(false);
  }

  return {
    runSummaries,
    setRunSummaries,
    totalAttachments,
    loadQualityControls,
    setLoadQualityControls,
    networkLoading,
    exportLoading,
    dataExportError,
    performExport
  };
}
