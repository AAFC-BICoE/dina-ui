import { TableColumn } from "common-ui/lib/list-page/types";
import { dateCell, DeleteButton, EditButton, stringArrayCell } from "common-ui";
import { MaterialSample } from "../../../types/collection-api";
import { getScientificNames } from "./organismUtils";
import { SplitMaterialSampleDropdownButton } from "./SplitMaterialSampleDropdownButton";
import Link from "next/link";

export const ELASTIC_SEARCH_COLUMN: TableColumn<MaterialSample>[] = [
  {
    Cell: ({ original: { id, data } }) => (
      <Link href={`/collection/material-sample/view?id=${id}`}>
        <a>
          {data?.attributes?.materialSampleName ||
            data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
            id}
        </a>
      </Link>
    ),
    label: "materialSampleName",
    accessor: "data.attributes.materialSampleName",
    isKeyword: true
  },
  {
    Cell: ({ original }) => {
      let organisms: any[] | undefined = original.included?.organism;
      if (organisms?.[0].attributes) {
        organisms = organisms.map((organism) => {
          return { ...organism, ...organism.attributes };
        });
      }
      const materialSample: MaterialSample = {
        type: "material-sample",
        organism: organisms
      };
      const scientificName = getScientificNames(materialSample);
      return <div className="stringArray-cell">{scientificName}</div>;
    },
    label: "determination.scientificName",
    accessor: "included",
    isKeyword: true,
    sortable: false
  }
];

export const ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW: TableColumn<MaterialSample>[] =
  [
    {
      Cell: ({ original: { id, data } }) => (
        <Link href={`/collection/material-sample/view?id=${id}`}>
          <a>
            {data?.attributes?.materialSampleName ||
              data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
              id}
          </a>
        </Link>
      ),
      label: "materialSampleName",
      accessor: "data.attributes.materialSampleName",
      isKeyword: true
    },
    {
      accessor: "data.attributes.materialSampleType",
      label: "materialSampleType",
      isKeyword: true
    },
    dateCell("createdOn", "data.attributes.createdOn"),
    stringArrayCell("tags", "data.attributes.tags"),
    {
      Cell: ({ original: { id, data } }) => (
        <div className="d-flex">
          <EditButton
            className="mx-2"
            entityId={id as string}
            entityLink="collection/material-sample"
            style={{ width: "5rem" }}
          />
          <SplitMaterialSampleDropdownButton
            ids={[id]}
            disabled={!data?.attributes?.materialSampleName}
            materialSampleType={data?.attributes?.materialSampleType}
          />
          <DeleteButton
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            type="material-sample"
            reload={true}
          />
        </div>
      ),
      label: "actions",
      sortable: false
    }
  ];
