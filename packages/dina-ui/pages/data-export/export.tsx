import {
  DinaForm,
  ReactTable,
  CommonMessage,
  BackButton,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DATA_EXPORT_COLUMNS_KEY,
  DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY,
  useApiClient,
  LoadingSpinner,
  OBJECT_EXPORT_IDS_KEY,
  downloadDataExport,
  Tooltip,
  NOT_EXPORTABLE_COLUMN_IDS,
  DATA_EXPORT_QUERY_KEY,
  TextField,
  SubmitButton
} from "packages/common-ui/lib";
import React, { useEffect } from "react";
import Link from "next/link";
import { KitsuResource, PersistedResource } from "kitsu";
import { Footer } from "packages/dina-ui/components";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useLocalStorage } from "@rehooks/local-storage";
import { useState } from "react";
import {
  DynamicFieldsMappingConfig,
  TableColumn
} from "packages/common-ui/lib/list-page/types";
import { useIndexMapping } from "packages/common-ui/lib/list-page/useIndexMapping";
import {
  getColumnSelectorIndexMapColumns,
  getGroupedIndexMappings
} from "packages/common-ui/lib/column-selector/ColumnSelectorUtils";
import { uniqBy } from "lodash";
import { VisibilityState, Table } from "@tanstack/react-table";
import { compact } from "lodash";
import { Metadata, ObjectExport } from "packages/dina-ui/types/objectstore-api";
import { DataExport, ExportType } from "packages/dina-ui/types/dina-export-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const MAX_DATA_EXPORT_FETCH_RETRIES = 60;

export default function ExportPage<TData extends KitsuResource>() {
  const router = useRouter();
  const [totalRecords] = useLocalStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );
  const uniqueName = String(router.query.uniqueName);
  const indexName = String(router.query.indexName);
  const entityLink = String(router.query.entityLink);
  const { formatMessage, formatNumber } = useIntl();
  const { bulkGet } = useApiClient();

  const [columns] = useLocalStorage<TableColumn<TData>[]>(
    `${uniqueName}_${DATA_EXPORT_COLUMNS_KEY}`,
    []
  );

  const [dataExportError, setDataExportError] = useState<JSX.Element>();

  const [exportType, setExportType] = useState<ExportType>("TABULAR_DATA");

  // Local storage for Export Objects
  const [localStorageExportObjectIds, setLocalStorageExportObjectIds] =
    useLocalStorage<string[]>(OBJECT_EXPORT_IDS_KEY, []);

  // Local storage for saving columns visibility
  const [localStorageColumnStates, setLocalStorageColumnStates] =
    useLocalStorage<VisibilityState | undefined>(
      `${uniqueName}_columnSelector`,
      {}
    );
  const [dynamicFieldMapping] = useLocalStorage<
    DynamicFieldsMappingConfig | undefined
  >(`${uniqueName}_${DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY}`, undefined);
  const [columnSelector, setColumnSelector] = useState<JSX.Element>(<></>);
  const [columnSelectorIndexMapColumns, setColumnSelectorIndexMapColumns] =
    useState<any[]>([]);
  const [loadedIndexMapColumns, setLoadedIndexMapColumns] =
    useState<boolean>(false);

  const [reactTable, setReactTable] = useState<Table<TData>>();
  // Combined columns from passed in columns
  const [totalColumns, setTotalColumns] =
    useState<TableColumn<TData>[]>(columns);

  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  if (queryObject) {
    delete (queryObject as any)._source;
  }

  const queryString = JSON.stringify(queryObject)?.replace(/"/g, '"');

  const { apiClient, save } = useApiClient();
  const [loading, setLoading] = useState(false);

  let groupedIndexMappings;
  const { indexMap } = useIndexMapping({
    indexName,
    dynamicFieldMapping
  });
  groupedIndexMappings = getGroupedIndexMappings(indexName, indexMap);
  useEffect(() => {
    if (indexMap) {
      getColumnSelectorIndexMapColumns({
        groupedIndexMappings,
        setLoadedIndexMapColumns,
        setColumnSelectorIndexMapColumns,
        apiClient,
        setLoadingIndexMapColumns: setLoading
      });
    }
  }, [indexMap]);

  useEffect(() => {
    const combinedColumns = uniqBy(
      [...totalColumns, ...columnSelectorIndexMapColumns],
      "id"
    );
    const columnVisibility = compact(
      combinedColumns.map((col) =>
        col.isColumnVisible === false
          ? { id: col.id, visibility: false }
          : undefined
      )
    ).reduce<VisibilityState>(
      (prev, cur, _) => ({ ...prev, [cur.id as string]: cur.visibility }),
      {}
    );
    setLocalStorageColumnStates({
      ...columnVisibility,
      ...localStorageColumnStates
    });
    setTotalColumns(combinedColumns);
  }, [loadedIndexMapColumns]);

  async function exportData(formik) {
    setLoading(true);
    // Make query to data-export
    const exportColumns = reactTable
      ?.getAllLeafColumns()
      .filter((column) => {
        if (NOT_EXPORTABLE_COLUMN_IDS.includes(column.id)) {
          return false;
        } else {
          return column.getIsVisible();
        }
      })
      .map((column) => column.id);
    const dataExportSaveArg = {
      resource: {
        type: "data-export",
        source: indexName,
        query: queryString,
        columns: reactTable ? exportColumns : [],
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
        fetchDataExportRetries += 1;
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
          dataExportGetResponse = await apiClient.get<DataExport>(
            `dina-export-api/data-export/${exportPostResponse[0].id}`,
            {}
          );
          // Wait 1 second before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
          fileIdentifiers
        },
        type: "object-export"
      };
      const objectExportResponse = await save<ObjectExport>(
        [objectExportSaveArg],
        {
          apiBaseUrl: "/objectstore-api"
        }
      );
      await getExport(objectExportResponse, formik);
      setLoading(false);
    }
  }
  const disableObjectExportButton =
    localStorageExportObjectIds.length < 1 || totalRecords > 100;

  return loading || !loadedIndexMapColumns ? (
    <LoadingSpinner loading={loading} />
  ) : (
    <PageLayout
      titleId="exportButtonText"
      buttonBarContent={
        <>
          <BackButton
            className="me-auto"
            entityLink={entityLink}
            byPassView={true}
          />
          <Link href={`/data-export/list?entityLink=${entityLink}`}>
            <a className="btn btn-primary">
              <DinaMessage id="viewExportHistoryButton" />
            </a>
          </Link>
        </>
      }
    >
      <DinaForm initialValues={{}}>
        {dataExportError}
        <div className="ms-2">
          <CommonMessage
            id="tableTotalCount"
            values={{ totalCount: formatNumber(totalRecords ?? 0) }}
          />
          <TextField
            name={"name"}
            customName="exportName"
            className="col-md-2"
          />
          <div className="mb-2">
            <span style={{ padding: "0 1.25rem 0 1.25rem" }}>
              <label>
                <input
                  type="radio"
                  name="export"
                  id="data"
                  checked={exportType === "TABULAR_DATA"}
                  onClick={() => {
                    setExportType("TABULAR_DATA");
                  }}
                  className="me-1"
                />
                <DinaMessage id="dataLabel" />
              </label>
            </span>
            {uniqueName === "object-store-list" && (
              <span style={{ paddingRight: "1.25rem" }}>
                <label
                  style={{
                    color: disableObjectExportButton ? "grey" : undefined
                  }}
                >
                  {" "}
                  <input
                    type="radio"
                    name="export"
                    id="objects"
                    checked={exportType === "OBJECT_ARCHIVE"}
                    onClick={() => {
                      setExportType("OBJECT_ARCHIVE");
                    }}
                    disabled={disableObjectExportButton}
                    className="me-1"
                  />
                  <DinaMessage id="objectsLabel" />
                </label>
              </span>
            )}
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
              <DinaMessage id="exportButtonText" />
            </SubmitButton>
            {uniqueName === "object-store-list" &&
              disableObjectExportButton && (
                <Tooltip id="exportObjectsMaxLimitTooltip" />
              )}
          </div>
          {columnSelector}
        </div>

        <ReactTable<TData>
          columns={totalColumns}
          data={[]}
          setColumnSelector={setColumnSelector}
          setReactTable={setReactTable}
          hideTable={true}
          uniqueName={uniqueName}
          menuOnly={true}
          indexName={indexName}
          columnSelectorDefaultColumns={columns}
        />
      </DinaForm>
      <Footer />
    </PageLayout>
  );
}
