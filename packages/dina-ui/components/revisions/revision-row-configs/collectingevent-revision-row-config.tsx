import { DateView } from "common-ui";
import Link from "next/link";
import { CollectingEvent } from "packages/dina-ui/types/collection-api/resources/CollectingEvent";
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";
import { Person } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const COLLECTING_EVENT_REVISION_ROW_CONFIG: RevisionRowConfig<CollectingEvent> = {
  name: ({ id }) => (
    <Link href={`/collection/collecting-event/view?id=${id}`}>
      <a>{id}</a>
    </Link>
  ),
  customValueCells: {
    // Date Fields:
    createdOn: ({ original: { value } }) => <DateView date={value} />,
    // Link to the collector:
    collectors: ({ original: { value: relation } }) => {
      return relation?.map(rel => (
        <ReferenceLink<Person>
          key={rel.id}
          baseApiPath="agent-api"
          instanceId={{ typeName: "person", cdoId: rel.id }}
          link={({ displayName }) => (
            <>
              <span>{displayName}</span> <br />
            </>
          )}
        />
      ));
    },
    // Link to the georeference assertion:
    geoReferenceAssertions: ({ original: { value: relation } }) => {
      return relation.map(rel => (
        <ReferenceLink<GeoReferenceAssertion>
          key={rel.cdoId}
          baseApiPath="collection-api"
          instanceId={{ typeName: "georeference-assertion", cdoId: rel.cdoId }}
          link={({ id }) => <span>{id}</span>}
        />
      ));
    }
  }
};
