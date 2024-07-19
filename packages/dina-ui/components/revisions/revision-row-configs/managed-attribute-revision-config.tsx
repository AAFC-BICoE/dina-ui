import { descriptionCell } from "common-ui";
import Link from "next/link";
import { ManagedAttribute } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const MANAGED_ATTRIBUTE_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig<ManagedAttribute> =
  {
    name: ({ id, name, key }) => (
      <Link href={`/collection/managed-attribute/edit?id=${id}`}>
        {name || key || id}
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
