import { allLangsDescriptionCell, KeyValueTable } from "common-ui";
import { Collection } from "../../../types/collection-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";
import Link from "next/link";

export const COLLECTION_REVISION_ROW_CONFIG: RevisionRowConfig<Collection> = {
  name: ({ id, name, code }) => (
    <Link href={`/collection/collection/view?id=${id}`}>
      <a>{name || code || id}</a>
    </Link>
  ),
  customValueCells: {
    identifiers: ({ original: { value: identifiers } }) =>
      identifiers?.map((identifier, index) => (
        <div className="pb-2" key={index}>
          <strong>{index + 1}:</strong>
          <KeyValueTable data={identifier} />
        </div>
      )),
    parentCollection: ({ original: { value } }) => (
      <ReferenceLink<Collection>
        baseApiPath="collection-api"
        type="collection"
        reference={value}
        name={c => c.name}
        href="/collection/collection/view?id="
      />
    ),
    multilingualDescription: allLangsDescriptionCell("multilingualDescription")
      .Cell
  }
};
