import Link from "next/link";
import { allLangsDescriptionCell } from "packages/common-ui/lib";
import { PreparationType } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const PREPARATION_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig<PreparationType> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/preparation-type/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell(
        "multilingualDescription"
      ).Cell
    }
  };
