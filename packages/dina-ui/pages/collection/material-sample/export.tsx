import {
  ColumnChooser,
  DinaForm,
  FieldHeader,
  ReactTable,
  dateCell,
  stringArrayCell
} from "packages/common-ui/lib";
import React, { useState } from "react";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import Link from "next/link";
import { KitsuResource } from "kitsu";
const columns: TableColumn<any>[] = [
  // Material Sample Name
  {
    id: "materialSampleName",
    cell: ({
      row: {
        original: { id, data }
      }
    }) => (
      <Link href={`/collection/material-sample/view?id=${id}`} passHref={true}>
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
export default function MaterialSampleExportPage<
  TData extends KitsuResource
>() {
  const [checkedIds, setCheckedIds] = useState<string[]>(
    columns.map((column) => column.id ?? "")
  );
  const [isCheckAll, setIsCheckAll] = useState<boolean>(true);

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ColumnChooser
          columns={columns}
          checkedIds={checkedIds}
          setCheckedIds={setCheckedIds}
          isCheckAll={isCheckAll}
          setIsCheckAll={setIsCheckAll}
        />
        <ReactTable<TData>
          // loading={loading}
          columns={
            columns.filter((column) =>
              column.id ? checkedIds.includes(column.id) : false
            ) as any
          }
          data={[]}
        />
      </DinaForm>
    </div>
  );
}
