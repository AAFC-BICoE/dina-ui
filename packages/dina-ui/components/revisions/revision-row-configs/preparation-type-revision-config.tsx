import Link from "next/link";
import { allLangsDescriptionCell, allLangsDescriptionCell8 } from "common-ui";
import { PreparationType } from "../../../types/collection-api";
import { RevisionRowConfig, RevisionRowConfig8 } from "../revision-row-config";

export const PREPARATION_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig8<PreparationType> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/preparation-type/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell8(
        "multilingualDescription"
      ).cell
    }
  };
