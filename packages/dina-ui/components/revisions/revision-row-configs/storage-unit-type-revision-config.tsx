import { descriptionCell } from "common-ui";
import Link from "next/link";
import { StorageUnitType } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const STORAGE_UNIT_TYPE_REVISION_ROW_CONFIG: RevisionRowConfig<StorageUnitType> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/storage-unit-type/view?id=${id}`}>
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
