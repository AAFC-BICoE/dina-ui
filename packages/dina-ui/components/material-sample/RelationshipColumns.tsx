import { TableColumn } from "../../../common-ui/lib/list-page/types";
import { MaterialSample } from "../../../dina-ui/types/collection-api";

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
  }
];
