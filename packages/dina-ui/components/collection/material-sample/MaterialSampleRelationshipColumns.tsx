import { TableColumn } from "common-ui/lib/list-page/types";
import { MaterialSample } from "../../../types/collection-api";
import { getScientificNames } from "./organismUtils";

export const ELASTIC_SEARCH_COLUMN: TableColumn<MaterialSample>[] = [
  {
    Cell: ({ original: { id, data } }) => (
      <a href={`/collection/material-sample/view?id=${id}`}>
        {data?.attributes?.materialSampleName ||
          data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
          id}
      </a>
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
