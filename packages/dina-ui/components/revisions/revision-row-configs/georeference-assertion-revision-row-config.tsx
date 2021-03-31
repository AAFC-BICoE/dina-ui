import { DateView } from "common-ui";
import Link from "next/link";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import { GeoReferenceAssertion } from "../../../types/collection-api/resources/GeoReferenceAssertion";
import { Person } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const GEOREFERENCE_ASSERTION_REVISION_ROW_CONFIG: RevisionRowConfig<GeoReferenceAssertion> = {
  name: ({
    collectingEvent,
    dwcDecimalLatitude,
    dwcDecimalLongitude,
    literalGeoreferencedBy
  }) => (
    <Link
      href={`/collection/collecting-event/view?id=${
        (collectingEvent as any)?.cdoId
      }`}
    >
      <a>
        {literalGeoreferencedBy ||
          `${dwcDecimalLatitude}, ${dwcDecimalLongitude}`}
      </a>
    </Link>
  ),
  customValueCells: {
    createdOn: ({ original: { value } }) => <DateView date={value} />,
    collectingEvent: ({ original: { value: instanceId } }) => {
      return (
        <ReferenceLink<CollectingEvent>
          baseApiPath="collection-api"
          instanceId={instanceId}
          link={({ id }) => (
            <Link href={`/collection/collecting-event/view?id=${id}`}>
              <a>{id}</a>
            </Link>
          )}
        />
      );
    },
    georeferencedBy: ({ original: { value: relation } }) =>
      relation?.map(rel => (
        <ReferenceLink<Person>
          key={rel.id}
          baseApiPath="agent-api"
          instanceId={{ typeName: "person", cdoId: rel.id }}
          link={({ id, displayName }) => (
            <>
              <Link href={`/person/view?id=${id}`}>{displayName}</Link> <br />
            </>
          )}
        />
      ))
  }
};
