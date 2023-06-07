import { TableColumn, TableColumn8 } from "common-ui/lib/list-page/types";
import {
  dateCell,
  dateCell8,
  DeleteButton,
  EditButton,
  FieldHeader,
  stringArrayCell,
  stringArrayCell8,
  useStringComparator
} from "common-ui";
import { Determination, MaterialSample } from "../../../types/collection-api";
import {
  getMaterialSampleSummaryScientificNames,
  getScientificNames
} from "./organismUtils";
import { SplitMaterialSampleDropdownButton } from "./SplitMaterialSampleDropdownButton";
import Link from "next/link";

export function useMaterialSampleRelationshipColumns() {
  const { compareByStringAndNumber } = useStringComparator();

  const PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN8: TableColumn8<any>[] = [
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
          original?.included?.organism.forEach((organism) => {
            determinations = determinations.concat(
              organism.attributes.determination
            );
          });
          scientificNames =
            getMaterialSampleSummaryScientificNames(determinations);
        } else {
          scientificNames = getMaterialSampleSummaryScientificNames(
            original?.effectiveDeterminations
          );
        }
        return <div className="stringArray-cell">{scientificNames}</div>;
      },
      header: () => <FieldHeader name="determination.scientificName" />,
      isKeyword: true,
      enableSorting: false,
      accessorKey: "included.attributes.determination"
    }
  ];

  const ELASTIC_SEARCH_COLUMN: TableColumn8<MaterialSample>[] = [
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

  const ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW: TableColumn8<MaterialSample>[] = [
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
    dateCell8("createdOn", "data.attributes.createdOn"),
    stringArrayCell8("tags", "data.attributes.tags"),
    {
      id: "action",
      cell: ({ row: { original } }) => (
        <div className="d-flex">
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
        </div>
      ),
      header: () => <FieldHeader name="actions" />,
      enableSorting: false
    }
  ];

  return {
    ELASTIC_SEARCH_COLUMN,
    PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN8,
    ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW
  };
}
