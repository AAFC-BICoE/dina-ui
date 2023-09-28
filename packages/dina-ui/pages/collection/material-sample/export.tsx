import {
  useColumnChooser,
  DinaForm,
  FieldHeader,
  ReactTable,
  dateCell,
  stringArrayCell,
  CommonMessage,
  DATA_EXPORT_SEARCH_RESULTS_KEY,
  useApiClient,
  ErrorViewer,
  BackToListButton,
  ButtonBar,
  BackButton
} from "packages/common-ui/lib";
import React, { useState, useEffect } from "react";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import Link from "next/link";
import { KitsuResource } from "kitsu";
import { Footer, Head, Nav } from "packages/dina-ui/components";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { useLocalStorage } from "@rehooks/local-storage";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

export default function MaterialSampleExportPage<
  TData extends KitsuResource
>() {
  const router = useRouter();
  const totalRecords = parseInt(router.query.totalRecords as string, 10);
  const hideTable: boolean | undefined = !!router.query.hideTable;

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

  const { columnChooser, checkedColumnIds } = useColumnChooser({
    columns,
    indexName: "material_sample_export"
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
        </ButtonBar>
        <div className="ms-2">
          <CommonMessage
            id="tableTotalCount"
            values={{ totalCount: formatNumber(totalRecords) }}
          />
          {columnChooser}
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
