import Link from "next/link";
import { allLangsDescriptionCell, allLangsDescriptionCell8 } from "common-ui";
import { PreparationMethod } from "../../../types/collection-api";
import { RevisionRowConfig, RevisionRowConfig8 } from "../revision-row-config";

export const PREPARATION_METHOD_REVISION_ROW_CONFIG: RevisionRowConfig8<PreparationMethod> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/preparation-method/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell8(
        "multilingualDescription"
      ).cell
    }
  };
