import Link from "next/link";
import { allLangsDescriptionCell } from "common-ui";
import { ManagedAttribute } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const MANAGED_ATTRIBUTE_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig<ManagedAttribute> =
  {
    name: ({ id, name, key }) => (
      <Link href={`/collection/managed-attribute/edit?id=${id}`}>
        <a>{name || key || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell(
        "multilingualDescription"
      ).Cell
    }
  };
