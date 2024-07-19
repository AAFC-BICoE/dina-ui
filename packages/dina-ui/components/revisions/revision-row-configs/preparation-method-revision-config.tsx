import { descriptionCell } from "common-ui";
import Link from "next/link";
import { PreparationMethod } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const PREPARATION_METHOD_REVISION_ROW_CONFIG: RevisionRowConfig<PreparationMethod> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/preparation-method/view?id=${id}`}>
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
