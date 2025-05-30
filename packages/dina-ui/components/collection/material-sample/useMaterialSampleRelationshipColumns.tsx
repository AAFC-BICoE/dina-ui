import { TableColumn } from "common-ui/lib/list-page/types";
import {
  dateCell,
  DeleteButton,
  EditButton,
  FieldHeader,
  scientificNameCell,
  stringArrayCell,
  useStringComparator
} from "common-ui";
import { MaterialSample } from "../../../types/collection-api";
import { SplitMaterialSampleDropdownButton } from "./SplitMaterialSampleDropdownButton";
import Link from "next/link";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import React from "react";
import { FaEllipsisV } from "react-icons/fa";
import { useIntl } from "react-intl";

export function materialSampleActionCell(
  formatMessage: any
): TableColumn<MaterialSample> {
  return {
    id: "action",
    cell: ({ row: { original } }) => {
      const CustomToggle = React.forwardRef(
        ({ children, onClick }: any, ref) => (
          <Button
            variant="secondary"
            size="sm"
            className="my-0 mx-2"
            onClick={(e) => onClick(e)}
            ref={ref as any}
          >
            {children}
          </Button>
        )
      );

      const materialSampleName =
        original.materialSampleName ??
        (original as any)?.data?.attributes?.materialSampleName;
      const materialSampleType =
        original.materialSampleType ??
        (original as any)?.data?.atrributes?.materialSampleType;

      return (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Dropdown>
            <Dropdown.Toggle variant="secondary" as={CustomToggle}>
              <FaEllipsisV />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.ItemText>
                {formatMessage({ id: "actions" })}
              </Dropdown.ItemText>
              <Dropdown.Divider />
              <div className="px-2">
                <EditButton
                  className="w-100"
                  entityId={original.id as string}
                  entityLink="collection/material-sample"
                />
                <SplitMaterialSampleDropdownButton
                  ids={[original.id ?? "unknown"]}
                  disabled={!materialSampleName}
                  materialSampleType={materialSampleType}
                  className="my-2 w-100"
                />
                <DeleteButton
                  id={original.id as string}
                  options={{ apiBaseUrl: "/collection-api" }}
                  type="material-sample"
                  reload={true}
                  className="w-100"
                  deleteRelationships={true}
                />
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      );
    },
    header: () => <FieldHeader name="actions" />,
    enableSorting: false,
    size: 100
  };
}

export function useMaterialSampleRelationshipColumns() {
  const { compareByStringAndNumber } = useStringComparator();
  const { formatMessage } = useIntl();

  const STORAGE_UNIT_GRID_ELASTIC_SEARCH_COLUMN: TableColumn<any>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.data?.attributes?.materialSampleName ??
          original?.materialSampleName;
        return (
          <Link href={`/collection/material-sample/view?id=${original?.id}`}>
            {materialSampleName || original?.id}
          </Link>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleName,
          b?.original?.materialSampleName
        ),
      isKeyword: true,
      enableSorting: true
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    }
  ];

  const PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN: TableColumn<any>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.type === "material-sample"
            ? original?.data?.attributes?.materialSampleName
            : original?.materialSampleName;
        return (
          <Link href={`/collection/material-sample/view?id=${original?.id}`}>
            {materialSampleName || original?.id}
          </Link>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleName,
          b?.original?.materialSampleName
        ),
      isKeyword: true,
      enableSorting: true
    },
    scientificNameCell()
  ];

  const ELASTIC_SEARCH_COLUMN: TableColumn<MaterialSample>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => (
        <Link href={`/collection/material-sample/view?id=${original.id}`}>
          {(original as any).data.attributes.materialSampleName ||
            (original as any).data.attributes.dwcOtherCatalogNumbers?.join?.(
              ", "
            ) ||
            original.id}
        </Link>
      ),
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: "alphanumeric",
      isKeyword: true,
      enableSorting: true
    },
    scientificNameCell()
  ];

  const ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW: TableColumn<MaterialSample>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => (
        <Link href={`/collection/material-sample/view?id=${original.id}`}>
          {(original as any).data?.attributes?.materialSampleName ||
            (original as any).data?.attributes?.dwcOtherCatalogNumbers?.join?.(
              ", "
            ) ||
            original.id}
        </Link>
      ),
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: (a: any, b: any): number => {
        return compareByStringAndNumber(a, b);
      },
      isKeyword: true
    },
    {
      id: "materialSampleType",
      accessorKey: "data.attributes.materialSampleType",
      header: () => <FieldHeader name="materialSampleType" />,
      isKeyword: true
    },
    {
      id: "materialSampleState",
      header: () => <FieldHeader name="materialSampleState" />,
      accessorKey: "data.attributes.materialSampleState",
      isKeyword: true
    },
    dateCell("createdOn", "data.attributes.createdOn"),

    stringArrayCell("tags", "data.attributes.tags"),
    materialSampleActionCell(formatMessage)
  ];

  return {
    ELASTIC_SEARCH_COLUMN,
    PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN,
    ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW,
    STORAGE_UNIT_GRID_ELASTIC_SEARCH_COLUMN
  };
}
