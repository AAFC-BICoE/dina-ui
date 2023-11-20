import {
  useColumnChooser,
  DinaForm,
  FieldHeader,
  ReactTable,
  dateCell,
  stringArrayCell,
  CommonMessage,
  ButtonBar,
  BackButton,
  DATA_EXPORT_TOTAL_RECORDS_KEY
} from "packages/common-ui/lib";
import React from "react";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import Link from "next/link";
import { KitsuResource } from "kitsu";
import { Footer, Head, Nav } from "packages/dina-ui/components";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useLocalStorage } from "@rehooks/local-storage";

export default function MaterialSampleExportPage<
  TData extends KitsuResource
>() {
  const router = useRouter();
  const [totalRecords] = useLocalStorage<number>(DATA_EXPORT_TOTAL_RECORDS_KEY);
  const hideTable: boolean | undefined = !!router.query.hideTable;
  const indexName = String(router.query.indexName);

  const { formatMessage, formatNumber } = useIntl();

  const columns: TableColumn<any>[] = [
    // Material Sample Name
    {
      id: "materialSampleName",
      cell: ({
        row: {
          original: { id, data }
        }
      }) => (
        <Link
          href={`/collection/material-sample/view?id=${id}`}
          passHref={true}
        >
          <a>
            {data?.attributes?.materialSampleName ||
              data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
              id}
          </a>
        </Link>
      ),
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      isKeyword: true
    },

    // Collection Name (External Relationship)
    {
      id: "collectionName",
      cell: ({
        row: {
          original: { included }
        }
      }) =>
        included?.collection?.id ? (
          <Link
            href={`/collection/collection/view?id=${included?.collection?.id}`}
          >
            <a>{included?.collection?.attributes?.name}</a>
          </Link>
        ) : null,
      header: () => <FieldHeader name="collection.name" />,
      accessorKey: "included.attributes.name",
      relationshipType: "collection",
      isKeyword: true
    },

    // List of catalogue numbers
    stringArrayCell(
      "dwcOtherCatalogNumbers",
      "data.attributes.dwcOtherCatalogNumbers"
    ),

    // Material Sample Type
    {
      id: "materialSampleType",
      header: () => <FieldHeader name="materialSampleType" />,
      accessorKey: "data.attributes.materialSampleType",
      isKeyword: true
    },

    // Created By
    {
      id: "createdBy",
      header: () => <FieldHeader name="createdBy" />,
      accessorKey: "data.attributes.createdBy",
      isKeyword: true
    },

    // Created On
    dateCell("createdOn", "data.attributes.createdOn"),

    // Material Sample State
    {
      id: "materialSampleState",
      header: () => <FieldHeader name="materialSampleState" />,
      accessorKey: "data.attributes.materialSampleState",
      isKeyword: true,
      isColumnVisible: false
    }
  ];

  const { checkedColumnIds, CustomMenu, dataExportError } = useColumnChooser({
    columns,
    localStorageKey: indexName
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
            columns={
              columns.filter((column) =>
                column.id ? checkedColumnIds.includes(column.id) : false
              ) as any
            }
            data={[]}
          />
        )}
      </DinaForm>
      <Footer />
    </div>
  );
}
