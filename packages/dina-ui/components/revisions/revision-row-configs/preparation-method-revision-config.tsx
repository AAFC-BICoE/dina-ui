import Link from "next/link";
import { allLangsDescriptionCell } from "common-ui";
import { PreparationMethod } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const PREPARATION_METHOD_REVISION_ROW_CONFIG: RevisionRowConfig<PreparationMethod> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/preparation-method/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell(
        "multilingualDescription"
      ).Cell
    }
  };
