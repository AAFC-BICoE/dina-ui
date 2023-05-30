import Link from "next/link";
import { allLangsDescriptionCell, allLangsDescriptionCell8 } from "common-ui";
import { ManagedAttribute } from "../../../types/collection-api";
import { RevisionRowConfig, RevisionRowConfig8 } from "../revision-row-config";

export const MANAGED_ATTRIBUTE_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig8<ManagedAttribute> =
  {
    name: ({ id, name, key }) => (
      <Link href={`/collection/managed-attribute/edit?id=${id}`}>
        <a>{name || key || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell8(
        "multilingualDescription"
      ).cell
    }
  };
