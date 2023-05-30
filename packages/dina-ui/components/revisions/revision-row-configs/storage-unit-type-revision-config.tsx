import { allLangsDescriptionCell, allLangsDescriptionCell8 } from "common-ui";
import Link from "next/link";
import { StorageUnitType } from "../../../types/collection-api";
import { RevisionRowConfig, RevisionRowConfig8 } from "../revision-row-config";

export const STORAGE_UNIT_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig8<StorageUnitType> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/storage-unit-type/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell8(
        "multilingualDescription"
      ).cell
    }
  };
