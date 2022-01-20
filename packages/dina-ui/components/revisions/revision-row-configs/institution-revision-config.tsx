import { KeyValueTable } from "common-ui";
import { Institution } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";

export const INSTITUTION_REVISION_ROW_CONFIG: RevisionRowConfig<Institution> = {
  customValueCells: {
    identifiers: ({ original: { value: identifiers } }) =>
      identifiers?.map((identifier, index) => (
        <div className="pb-2" key={index}>
          <strong>{index + 1}:</strong>
          <KeyValueTable data={identifier} />
        </div>
      ))
  }
};
