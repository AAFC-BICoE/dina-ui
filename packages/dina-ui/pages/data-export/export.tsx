import {
  useColumnChooser,
  DinaForm,
  ReactTable,
  CommonMessage,
  ButtonBar,
  BackButton,
  DATA_EXPORT_TOTAL_RECORDS_KEY
} from "packages/common-ui/lib";
import React from "react";
import Link from "next/link";
import { KitsuResource } from "kitsu";
import { Footer, Head, Nav } from "packages/dina-ui/components";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useLocalStorage } from "@rehooks/local-storage";
import { Table, Column } from "@tanstack/react-table";
import { useState } from "react";

export default function MaterialSampleExportPage<
  TData extends KitsuResource
>() {
  const router = useRouter();
  const [totalRecords] = useLocalStorage<number>(DATA_EXPORT_TOTAL_RECORDS_KEY);
  const hideTable: boolean | undefined = !!router.query.hideTable;
  const indexName = String(router.query.indexName);
  const { formatMessage, formatNumber } = useIntl();
  const [selectedColumns] = useLocalStorage<
    Column<TData, unknown>[] | undefined
  >(`${indexName}_columnChooser`);
  const [_columnSelectionCheckboxes, setColumnSelectionCheckboxes] =
    useState<JSX.Element>();
  const [reactTable, setReactTable] = useState<Table<TData>>();

  const { CustomMenu, dataExportError } = useColumnChooser({
    localStorageKey: indexName,
    reactTable
  });

  return (
    <div>
      <Head title={formatMessage({ id: "exportButtonText" })} />
      <Nav />
      <DinaForm initialValues={{}}>
        <ButtonBar>
          <BackButton
            className="me-auto"
            entityLink="/collection/material-sample"
            reloadLastSearch={true}
            byPassView={true}
          />
          <Link href={`/data-export/list`}>
            <a className="btn btn-primary">
              <DinaMessage id="dataExports" />
            </a>
          </Link>
        </ButtonBar>
        <div className="ms-2">
          {typeof dataExportError !== "undefined" && dataExportError}
          <CommonMessage
            id="tableTotalCount"
            values={{ totalCount: formatNumber(totalRecords ?? 0) }}
          />
          <CustomMenu />
        </div>

        {!hideTable && (
          <ReactTable<TData>
            columns={selectedColumns ? selectedColumns : []}
            data={[]}
            setColumnSelectionCheckboxes={setColumnSelectionCheckboxes}
            setReactTable={setReactTable}
          />
        )}
      </DinaForm>
      <Footer />
    </div>
  );
}
