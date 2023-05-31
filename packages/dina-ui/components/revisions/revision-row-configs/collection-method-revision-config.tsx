import { allLangsDescriptionCell8 } from "common-ui";
import Link from "next/link";
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
      multilingualDescription: allLangsDescriptionCell8(
        "multilingualDescription"
      ).cell
    }
  };
