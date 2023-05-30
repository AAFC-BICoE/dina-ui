import {
  allLangsDescriptionCell,
  allLangsDescriptionCell8,
  KeyValueTable
} from "common-ui";
import { Collection } from "../../../types/collection-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig, RevisionRowConfig8 } from "../revision-row-config";
import Link from "next/link";

export const COLLECTION_REVISION_ROW_CONFIG: RevisionRowConfig8<Collection> = {
  name: ({ id, name, code }) => (
    <Link href={`/collection/collection/view?id=${id}`}>
      <a>{name || code || id}</a>
    </Link>
  ),
  customValueCells: {
    identifiers: ({
      row: {
        original: { value: identifiers }
      }
    }) =>
      identifiers?.map((identifier, index) => (
        <div className="pb-2" key={index}>
          <strong>{index + 1}:</strong>
          <KeyValueTable data={identifier} />
        </div>
      )),
    parentCollection: ({
      row: {
        original: { value }
      }
    }) => (
      <ReferenceLink<Collection>
        baseApiPath="collection-api"
        type="collection"
        reference={value}
        name={(c) => c.name}
        href="/collection/collection/view?id="
      />
    ),
    multilingualDescription: allLangsDescriptionCell8("multilingualDescription")
      .cell
  }
};
