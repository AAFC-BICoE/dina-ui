import { allLangsDescriptionCell } from "common-ui";
import Link from "next/link";
import { MaterialSampleType } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const MATERIAL_SAMPLE_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig<MaterialSampleType> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/material-sample-type/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell(
        "multilingualDescription"
      ).Cell
    }
  };
