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
  LoadingSpinner
} from "packages/common-ui/lib";
import React, { useEffect } from "react";
import Link from "next/link";
import { KitsuResource } from "kitsu";
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

export default function ExportPage<TData extends KitsuResource>() {
  const router = useRouter();
  const [totalRecords] = useLocalStorage<number>(DATA_EXPORT_TOTAL_RECORDS_KEY);
  const hideTable: boolean | undefined = !!router.query.hideTable;
  const uniqueName = String(router.query.uniqueName);
  const indexName = String(router.query.indexName);
  const entityLink = String(router.query.entityLink);
  const { formatMessage, formatNumber } = useIntl();
  const [columns] = useLocalStorage<TableColumn<TData>[]>(
    `${uniqueName}_${DATA_EXPORT_COLUMNS_KEY}`,
    []
  );
  const [dynamicFieldMapping] = useLocalStorage<
    DynamicFieldsMappingConfig | undefined
  >(`${uniqueName}_${DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY}`, undefined);
  const [columnSelector, setColumnSelector] = useState<JSX.Element>(<></>);
  const [columnSelectorIndexMapColumns, setColumnSelectorIndexMapColumns] =
    useState<any[]>([]);
  const [loadedIndexMapColumns, setLoadedIndexMapColumns] =
    useState<boolean>(false);
  // Combined columns from passed in columns
  const [totalColumns, setTotalColumns] =
    useState<TableColumn<TData>[]>(columns);

  const { apiClient } = useApiClient();
  const [loading, setLoading] = useState(false);

  let groupedIndexMappings;
  const { indexMap } = useIndexMapping({
    indexName,
    dynamicFieldMapping
  });
  groupedIndexMappings = getGroupedIndexMappings(indexName, indexMap);
  useEffect(() => {
    setLoading(true);
    if (indexMap) {
      getColumnSelectorIndexMapColumns({
        groupedIndexMappings,
        setLoadedIndexMapColumns,
        setColumnSelectorIndexMapColumns,
        apiClient
      });
    }

    setLoading(false);
  }, [indexMap]);

  useEffect(() => {
    const combinedColumns = uniqBy(
      [...totalColumns, ...columnSelectorIndexMapColumns],
      "id"
    );
    setTotalColumns(combinedColumns);
  }, [loadedIndexMapColumns]);

  return loading || !loadedIndexMapColumns ? (
    <LoadingSpinner loading={loading} />
  ) : (
    <div>
      <Head title={formatMessage({ id: "exportButtonText" })} />
      <Nav />
      <DinaForm initialValues={{}}>
        <ButtonBar>
          <BackButton
            className="me-auto"
            entityLink={entityLink}
            byPassView={true}
          />
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
          {columnSelector}
        </div>

        <ReactTable<TData>
          columns={totalColumns}
          data={[]}
          setColumnSelector={setColumnSelector}
          hideTable={hideTable}
          uniqueName={uniqueName}
          menuOnly={true}
        />
      </DinaForm>
      <Footer />
    </div>
  );
}
