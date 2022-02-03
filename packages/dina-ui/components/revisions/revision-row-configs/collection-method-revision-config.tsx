import Link from "next/link";
import { allLangsDescriptionCell } from "common-ui";
import { CollectionMethod } from "../../../types/collection-api/resources/CollectionMethod";
import { RevisionRowConfig } from "../revision-row-config";

export const COLLECTION_METHOD_REVISION_ROW_CONFIG: RevisionRowConfig<CollectionMethod> =
  {
    name: ({ id, name }) => (
      <Link href={`/collection/collection-method/view?id=${id}`}>
        <a>{name || id}</a>
      </Link>
    ),
    customValueCells: {
      multilingualDescription: allLangsDescriptionCell(
        "multilingualDescription"
      ).Cell
    }
  };
