import { descriptionCell } from "common-ui";
import Link from "next/link";
import { PreparationType } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const PREPARATION_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig<PreparationType> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/preparation-type/view?id=${id}`}>
        {name || id}
      </Link>
    ),
    customValueCells: {
      multilingualDescription: descriptionCell(
        true,
        false,
        "multilingualDescription"
      ).cell
    }
  };
