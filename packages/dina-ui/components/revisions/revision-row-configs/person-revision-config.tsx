import { KeyValueTable } from "common-ui";
import Link from "next/link";
import { Organization, Person } from "../../../types/agent-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const PERSON_REVISION_ROW_CONFIG: RevisionRowConfig<Person> = {
  name: ({ id, displayName }) => (
    <Link href={`/person/view?id=${id}`}>{displayName || id}</Link>
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
    organizations: ({
      row: {
        original: { value }
      }
    }) => (
      <div>
        {value?.map(
          (relation) =>
            relation && (
              <div key={relation.id || relation.cdoId}>
                <ReferenceLink<Organization>
                  type="organization"
                  baseApiPath="agent-api"
                  reference={relation}
                  name={(org) => org.names?.[0]?.name || org.id}
                  href="/organization/view?id="
                />
              </div>
            )
        )}
      </div>
    )
  }
};
