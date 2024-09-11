import {
  DinaForm,
  CommonMessage,
  BackButton,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY,
  useApiClient,
  OBJECT_EXPORT_IDS_KEY,
  downloadDataExport,
  Tooltip,
  DATA_EXPORT_QUERY_KEY,
  TextField,
  SubmitButton,
  ColumnSelectorMemo
} from "packages/common-ui/lib";
import Link from "next/link";
import { KitsuResource, PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useLocalStorage } from "@rehooks/local-storage";
import React, { useState } from "react";
import {
  DynamicFieldsMappingConfig,
  TableColumn
} from "packages/common-ui/lib/list-page/types";
import { useIndexMapping } from "packages/common-ui/lib/list-page/useIndexMapping";
import { Metadata, ObjectExport } from "packages/dina-ui/types/objectstore-api";
import { DataExport, ExportType } from "packages/dina-ui/types/dina-export-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { useSessionStorage } from "usehooks-ts";
import { Card, ButtonGroup, ToggleButton, Spinner } from "react-bootstrap";
import Select from "react-select";
import { useSavedExports } from "./useSavedExports";

const MAX_DATA_EXPORT_FETCH_RETRIES = 6;
const BASE_DELAY_EXPORT_FETCH_MS = 2000;

export interface SavedExportOption {
  label: string;
  value: string;
  // resource: SplitConfiguration;
}

export default function ExportPage<TData extends KitsuResource>() {
  const { formatNumber } = useIntl();
  const { bulkGet, apiClient, save } = useApiClient();
  const router = useRouter();

  // Unique name to be used for the local storage.
  const uniqueName = String(router.query.uniqueName);

  // Index mapping name to retrieve all the possible fields.
  const indexName = String(router.query.indexName);

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  // Columns selected on the dropdown.
  const [columnsToExport, setColumnsToExport] = useState<TableColumn<TData>[]>(
    []
  );

  // State holding the current export type. For example, Data export / Object export.
  const [exportType, setExportType] = useState<ExportType>("TABULAR_DATA");

  // Local storage for Export Objects
  const [localStorageExportObjectIds] = useSessionStorage<string[]>(
    OBJECT_EXPORT_IDS_KEY,
    []
  );

  // Dynamic mappings from the list page to be applied for the export.
  const [dynamicFieldMapping] = useLocalStorage<
    DynamicFieldsMappingConfig | undefined
  >(`${uniqueName}_${DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY}`, undefined);

  const [dataExportError, setDataExportError] = useState<JSX.Element>();
  const [loading, setLoading] = useState(false);

  const { indexMap } = useIndexMapping({
    indexName,
    dynamicFieldMapping
  });

  const { allSavedExports, loadingSavedExports } = useSavedExports({
    indexName
  });

  async function exportData(formik) {
    setLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Prepare the query to be used for exporting purposes.
    if (queryObject) {
      delete (queryObject as any)._source;
    }
    const queryString = JSON.stringify(queryObject)?.replace(/"/g, '"');

    // Make query to data-export
    const dataExportSaveArg = {
      resource: {
        type: "data-export",
        source: indexName,
        query: queryString,
        columns: columnsToExport.map((item) => item.id),
        name: formik?.values?.name
      },
      type: "data-export"
    };

    const dataExportPostResponse = await save<DataExport>([dataExportSaveArg], {
      apiBaseUrl: "/dina-export-api"
    });

    await getExport(dataExportPostResponse, formik);
    setLoading(false);
  }

  // data-export POST will return immediately but export won't necessarily be available
  // continue to get status of export until it's COMPLETED
  async function getExport(
    exportPostResponse: PersistedResource<KitsuResource>[],
    formik?: any
  ) {
    let isFetchingDataExport = true;
    let fetchDataExportRetries = 0;
    let dataExportGetResponse;
    while (isFetchingDataExport) {
      if (fetchDataExportRetries <= MAX_DATA_EXPORT_FETCH_RETRIES) {
        if (dataExportGetResponse?.data?.status === "COMPLETED") {
          // Get the exported data
          await downloadDataExport(
            apiClient,
            exportPostResponse[0].id,
            formik?.values?.name
          );
          isFetchingDataExport = false;
        } else if (dataExportGetResponse?.data?.status === "ERROR") {
          isFetchingDataExport = false;
          setLoading(false);
          setDataExportError(
            <div className="alert alert-danger">
              <DinaMessage id="dataExportError" />
            </div>
          );
        } else {
          try {
            dataExportGetResponse = await apiClient.get<DataExport>(
              `dina-export-api/data-export/${exportPostResponse[0].id}`,
              {}
            );
          } catch (e) {
            if (e.cause.status === 404) {
              console.warn(e.cause);
            } else {
              throw e;
            }
          }

          // Exponential Backoff
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              BASE_DELAY_EXPORT_FETCH_MS * 2 ** fetchDataExportRetries
            )
          );
          fetchDataExportRetries += 1;
        }
      } else {
        // Max retries reached
        isFetchingDataExport = false;
        setLoading(false);
        setDataExportError(
          <div className="alert alert-danger">
            <DinaMessage id="dataExportError" />
          </div>
        );
      }
    }
    isFetchingDataExport = false;
  }

  // Function to export and download Objects
  async function exportObjects(formik) {
    {
      setLoading(true);

      // Clear error message.
      setDataExportError(undefined);

      const paths = localStorageExportObjectIds.map(
        (id) => `metadata/${id}?include=derivatives`
      );
      const metadatas: PersistedResource<Metadata>[] = await bulkGet(paths, {
        apiBaseUrl: "/objectstore-api"
      });
      const imageMetadatas = metadatas.filter((metadata) => {
        return metadata.dcType === "IMAGE";
      });

      const fileIdentifiers = imageMetadatas.map((imageMetadata) => {
        // If image has derivative, return large image derivative fileIdentifier if present
        if (imageMetadata.derivatives) {
          const largeImageDerivative = imageMetadata.derivatives.find(
            (derivative) => {
              if (derivative.derivativeType === "LARGE_IMAGE") {
                return true;
              }
            }
          );
          if (largeImageDerivative) {
            return largeImageDerivative.fileIdentifier;
          }
        }
        // Otherwise, return original fileIdentifier
        return imageMetadata.fileIdentifier;
      });
      const objectExportSaveArg = {
        resource: {
          type: "object-export",
          fileIdentifiers,
          name: formik?.values?.name
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
        await getExport(objectExportResponse, formik);
      } catch (e) {
        setDataExportError(
          <div className="alert alert-danger">{e?.message ?? e.toString()}</div>
        );
      }

      setLoading(false);
    }
  }

  const disableObjectExportButton =
    localStorageExportObjectIds.length < 1 || totalRecords > 100;

  return (
    <PageLayout
      titleId="exportButtonText"
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
                  {uniqueName === "object-store-list" && (
                    <>
                      <strong>Export Type</strong>
                      <br />
                      <ButtonGroup className="mt-1">
                        <ToggleButton
                          id="export-data"
                          value={"data"}
                          type={"radio"}
                          checked={exportType === "TABULAR_DATA"}
                          onClick={() => {
                            setExportType("TABULAR_DATA");
                          }}
                          variant={
                            exportType === "TABULAR_DATA"
                              ? "primary"
                              : "outline-primary"
                          }
                          disabled={loading}
                        >
                          <DinaMessage id="dataLabel" />
                        </ToggleButton>
                        <ToggleButton
                          id="export-object"
                          value={"object"}
                          type={"radio"}
                          checked={exportType === "OBJECT_ARCHIVE"}
                          onClick={() => {
                            setExportType("OBJECT_ARCHIVE");
                          }}
                          variant={
                            exportType === "OBJECT_ARCHIVE"
                              ? "primary"
                              : "outline-primary"
                          }
                          disabled={loading}
                        >
                          <DinaMessage id="objectsLabel" />
                        </ToggleButton>
                      </ButtonGroup>
                    </>
                  )}
                </div>

                {exportType === "TABULAR_DATA" && (
                  <div className="col-md-4">
                    <strong>Load saved columns to export</strong>
                    <Select<SavedExportOption>
                      className="mt-1 mb-3"
                      name="splitConfiguration"
                      options={[]}
                      onChange={(selection) => {
                        if (selection) {
                          // setSplitConfigurationID?.(selection.value);
                          // setSplitConfiguration(selection.resource);
                        }
                      }}
                      isLoading={loadingSavedExports}
                      autoFocus={true}
                      value={undefined}
                    />
                  </div>
                )}
              </div>
            </Card.Body>
            <Card.Footer>
              <SubmitButton
                buttonProps={(formik) => ({
                  style: { width: "8rem" },
                  disabled: loading,
                  onClick: () => {
                    if (exportType === "TABULAR_DATA") {
                      exportData(formik);
                    } else {
                      exportObjects(formik);
                    }
                  }
                })}
              >
                {loading ? (
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
                  <DinaMessage id="exportButtonText" />
                )}
              </SubmitButton>
              {uniqueName === "object-store-list" &&
                disableObjectExportButton && (
                  <Tooltip id="exportObjectsMaxLimitTooltip" />
                )}
            </Card.Footer>
          </Card>

          {exportType === "TABULAR_DATA" && (
            <>
              <h4 className="mt-4">Columns to export</h4>
              <Card>
                <Card.Body>
                  <ColumnSelectorMemo
                    exportMode={true}
                    displayedColumns={columnsToExport as any}
                    setDisplayedColumns={setColumnsToExport as any}
                    indexMapping={indexMap}
                    uniqueName={uniqueName}
                    dynamicFieldsMappingConfig={dynamicFieldMapping}
                  />
                </Card.Body>
              </Card>
            </>
          )}
        </div>
      </DinaForm>
    </PageLayout>
  );
}
