import {
  ColumnSelector,
  DinaForm,
  ReactTable,
  CommonMessage,
  ButtonBar,
  BackButton,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DATA_EXPORT_COLUMNS_KEY,
  ColumnSelectorMenu
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
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { CustomMenuProps } from "packages/dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";

export default function ExportPage<TData extends KitsuResource>() {
  const router = useRouter();
  const [totalRecords] = useLocalStorage<number>(DATA_EXPORT_TOTAL_RECORDS_KEY);
  const hideTable: boolean | undefined = !!router.query.hideTable;
  const uniqueName = String(router.query.uniqueName);
  const { formatMessage, formatNumber } = useIntl();
  const [columns] = useLocalStorage<TableColumn<TData>[] | undefined>(
    `${uniqueName}_${DATA_EXPORT_COLUMNS_KEY}`
  );

  const [columnSelectorCustomMenu, setColumnSelectorCustomMenu] =
    useState<JSX.Element>(<></>);

  return (
    <div>
      <Head title={formatMessage({ id: "exportButtonText" })} />
      <Nav />
      <DinaForm initialValues={{}}>
        <ButtonBar>
          <BackButton
            className="me-auto"
            entityLink="/collection/material-sample"
            byPassView={true}
          />
          <Link href={`/data-export/list`}>
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
          {columnSelectorCustomMenu}
        </div>

        <ReactTable<TData>
          columns={columns ? columns : []}
          data={[]}
          setColumnSelectorCustomMenu={setColumnSelectorCustomMenu}
          hideTable={hideTable}
          uniqueName={uniqueName}
        />
      </DinaForm>
      <Footer />
    </div>
  );
}
