import {
  DinaForm,
  FieldHeader,
  ReactTable,
  TextField,
  dateCell,
  stringArrayCell,
  useGroupedCheckBoxes
} from "packages/common-ui/lib";
import { CustomMenuProps } from "packages/dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Select from "react-select";
import Button from "react-bootstrap/Button";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import Link from "next/link";
import { KitsuResource } from "kitsu";

export default function MaterialSampleExportPage<
  TData extends KitsuResource
>() {
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

  const { CheckBoxField, CheckBoxHeader, setAvailableItems, availableItems } =
    useGroupedCheckBoxes({
      fieldName: "selectedColumns"
    });

  const [selectedColumns, setSelectedColumns] = useState<TableColumn<TData>[]>(
    []
  );

  const CustomMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "20px"
          }}
          className={props.className}
          aria-labelledby={props.labeledBy}
        >
          <TextField name="filterColumns" placeholder="Search" />
          <Dropdown.Divider />
          <CheckBoxHeader />
          {columns.map((column) => {
            return (
              <div key={column.id}>
                <CheckBoxField
                  key={column.id}
                  resource={column as any}
                  className="inline-flex"
                />
                {typeof column === "string" ? (
                  <FieldHeader name={column} />
                ) : (
                  column?.header &&
                  typeof column.header !== "string" &&
                  (column as any).header()
                )}
              </div>
            );
          })}
        </div>
      );
    }
  );

  return (
    <div>
      <DinaForm initialValues={{}}>
        <Dropdown>
          <Dropdown.Toggle>
            <DinaMessage id="selectColumn" />
          </Dropdown.Toggle>
          <Dropdown.Menu as={CustomMenu} />
        </Dropdown>
        <ReactTable<TData>
          // loading={loading}
          columns={columns as any}
          data={[]}
        />
      </DinaForm>
    </div>
  );
}
