import { allLangsDescriptionCell8, KeyValueTable } from "common-ui";
import Link from "next/link";
import { Institution } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const INSTITUTION_REVISION_ROW_CONFIG: RevisionRowConfig<Institution> = {
  name: ({ name, id }) => (
    <Link href={`/collection/institution/view?id=${id}`}>
      <a>{name || id}</a>
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
    multilingualDescription: allLangsDescriptionCell8("multilingualDescription")
      .cell
  }
};
