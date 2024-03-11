import {
  DinaForm,
  ReactTable,
  CommonMessage,
  ButtonBar,
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
  useDinaFormContext,
  SubmitButton
} from "packages/common-ui/lib";
import React, { useEffect } from "react";
import Link from "next/link";
import { KitsuResource, PersistedResource } from "kitsu";
import { Footer, Head, Nav } from "packages/dina-ui/components";
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
import { Button } from "react-bootstrap";
import { Metadata, ObjectExport } from "packages/dina-ui/types/objectstore-api";
import { DataExport } from "packages/dina-ui/types/dina-export-api";
import { useFormikContext } from "formik";

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

    // data-export POST will return immediately but export won't necessarily be available
    // continue to get status of export until it's COMPLETED
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
            dataExportPostResponse[0].id,
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
            `dina-export-api/data-export/${dataExportPostResponse[0].id}`,
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
    setLoading(false);
  }

  // Function to export and download Objects
  async function exportObjects() {
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
      downloadDataExport(apiClient, objectExportResponse[0].id);
      setLoading(false);
    }
  }
  const disableObjectExportButton =
    localStorageExportObjectIds.length < 1 || totalRecords > 100;

  return loading || !loadedIndexMapColumns ? (
    <LoadingSpinner loading={loading} />
  ) : (
    <div>
      <Head title={formatMessage({ id: "exportButtonText" })} />
      <Nav />
      <DinaForm initialValues={{}}>
        {dataExportError}
        <ButtonBar>
          <BackButton
            className="me-auto"
            entityLink={entityLink}
            byPassView={true}
          />
          <SubmitButton
            buttonProps={(formik) => ({
              style: { width: "8rem" },
              disabled: loading,
              onClick: () => {
                exportData(formik);
              }
            })}
          >
            <DinaMessage id="exportButtonText" />
          </SubmitButton>
          {uniqueName === "object-store-list" && (
            <div className="me-2">
              {" "}
              <Button
                disabled={loading || disableObjectExportButton}
                className="btn btn-primary"
                onClick={exportObjects}
              >
                {loading ? (
                  <LoadingSpinner loading={loading} />
                ) : (
                  formatMessage({ id: "exportObjectsButtonText" })
                )}
              </Button>
              {disableObjectExportButton && (
                <Tooltip id="exportObjectsMaxLimitTooltip" />
              )}
            </div>
          )}
          <Link href={`/data-export/list?entityLink=${entityLink}`}>
            <a className="btn btn-primary">
              <DinaMessage id="dataExports" />
            </a>
          </Link>
        </ButtonBar>
        <div className="ms-2">
          <CommonMessage
            id="tableTotalCount"
            values={{ totalCount: formatNumber(totalRecords ?? 0) }}
          />
          <TextField
            name={"name"}
            customName="dataExportName"
            className="col-md-2"
          />
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
    </div>
  );
}
