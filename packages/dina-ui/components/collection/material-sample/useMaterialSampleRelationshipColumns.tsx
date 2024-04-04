import { TableColumn } from "common-ui/lib/list-page/types";
import {
  dateCell,
  DeleteButton,
  EditButton,
  FieldHeader,
  stringArrayCell,
  useStringComparator
} from "common-ui";
import { Determination, MaterialSample } from "../../../types/collection-api";
import { getDeterminations, getScientificNames } from "./organismUtils";
import { SplitMaterialSampleDropdownButton } from "./SplitMaterialSampleDropdownButton";
import Link from "next/link";
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import React from "react";

export function useMaterialSampleRelationshipColumns() {
  const { compareByStringAndNumber } = useStringComparator();

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
            <a>{materialSampleName || original?.id}</a>
          </Link>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: "alphanumeric",
      isKeyword: true,
      enableSorting: true
    },
    {
      id: "scientificName",
      cell: ({ row: { original } }) => {
        let scientificNames: string = "";

        if (original?.type === "material-sample") {
          let determinations: Determination[] = [];
          original?.included?.organism?.forEach((org) => {
            determinations = determinations.concat(
              org.attributes.determination
            );
          });
          const organism = original?.included?.organism?.map((org) => ({
            id: org?.id,
            type: org?.type,
            determination: org?.attributes?.determination,
            isTarget: org?.attributes?.isTarget
          }));
          const materialSample: MaterialSample = {
            type: "material-sample",
            materialSampleName: original?.data?.attributes?.materialSampleName,
            organism
          };
          scientificNames = getScientificNames(materialSample);
        } else {
          scientificNames = getDeterminations(
            original?.effectiveDeterminations
          );
        }
        return <div className="stringArray-cell">{scientificNames}</div>;
      },
      header: () => <FieldHeader name="determination.scientificName" />,
      isKeyword: true,
      enableSorting: false,
      additionalAccessors: [
        "included.attributes.determination",
        "included.attributes.isTarget"
      ]
    }
  ];

  const ELASTIC_SEARCH_COLUMN: TableColumn<MaterialSample>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => (
        <Link href={`/collection/material-sample/view?id=${original.id}`}>
          <a>
            {(original as any).data.attributes.materialSampleName ||
              (original as any).data.attributes.dwcOtherCatalogNumbers?.join?.(
                ", "
              ) ||
              original.id}
          </a>
        </Link>
      ),
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: "alphanumeric",
      isKeyword: true,
      enableSorting: true
    },
    {
      id: "scientificName",
      cell: ({ row: { original } }) => {
        const organisms = (original as any).included?.organism ?? [];
        const materialSample: MaterialSample = {
          type: "material-sample",
          organism: organisms
        };
        const scientificName = getScientificNames(materialSample);
        return <div className="stringArray-cell">{scientificName}</div>;
      },
      header: () => <FieldHeader name="determination.scientificName" />,
      isKeyword: true,
      enableSorting: false
    }
  ];

  const ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW: TableColumn<MaterialSample>[] = [
    {
      cell: ({ row: { original } }) => (
        <Link href={`/collection/material-sample/view?id=${original.id}`}>
          <a>
            {(original as any).data?.attributes?.materialSampleName ||
              (
                original as any
              ).data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
              original.id}
          </a>
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
      accessorKey: "data.attributes.materialSampleType",
      header: () => <FieldHeader name="materialSampleType" />,
      isKeyword: true
    },
    dateCell("createdOn", "data.attributes.createdOn"),
    stringArrayCell("tags", "data.attributes.tags"),
    {
      id: "action",
      cell: ({ row: { original } }) => {
        const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
          <Button variant="secondary" size="sm" onClick={(e) => onClick(e)} ref={ref}>
            {children}
          </Button>
        ));

        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Dropdown>
              <Dropdown.Toggle variant="secondary" as={CustomToggle}>
                ...
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <EditButton
                  className="mx-2"
                  entityId={original.id as string}
                  entityLink="collection/material-sample"
                  style={{ width: "5rem" }}
                />
                <SplitMaterialSampleDropdownButton
                  ids={[original.id ?? "unknown"]}
                  disabled={!(original as any).data?.attributes?.materialSampleName}
                  materialSampleType={
                    (original as any).data?.attributes?.materialSampleType
                  }
                />
                <DeleteButton
                  id={original.id as string}
                  options={{ apiBaseUrl: "/collection-api" }}
                  type="material-sample"
                  reload={true}
                />
              </Dropdown.Menu>
            </Dropdown>
          </div>
        )
      },
      header: () => <FieldHeader name="actions" />,
      enableSorting: false
    }
  ];

  return {
    ELASTIC_SEARCH_COLUMN,
    PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN,
    ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW
  };
}
