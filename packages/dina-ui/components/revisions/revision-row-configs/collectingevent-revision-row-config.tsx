import { DateView } from "common-ui";
import Link from "next/link";
import { CollectingEvent } from "packages/dina-ui/types/collection-api/resources/CollectingEvent";
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";
import { Person } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const COLLECTING_EVENT_REVISION_ROW_CONFIG: RevisionRowConfig<CollectingEvent> = {
  name: ({ id  }) => (
    <Link href={`/collecting-event/view?id=${id}`}>
      <a>{id}</a>
    </Link>
  ),
  customValueCells: {
    // Date Fields:
    createdOn: ({ original: { value } }) => <DateView date={value} />,
    startEventDateTime: ({ original: { value } }) => <DateView date={value} />,
    endEventDateTime: ({ original: { value } }) => <DateView date={value} />,
    // Link to the collector:
    collectors: ({ original: { value: relation } }) => {
      return (
        relation && (
        <ReferenceLink<Person>
          baseApiPath="agent-api"
          instanceId={{ typeName: "person", cdoId: relation.id }}
          link={({ displayName }) => <span>{displayName}</span>}
        />
      ));
    },
    // Link to the georeference assertion:
    geoReferenceAssertions: ({ original: { value: relation } }) => {
      return (
        relation && (
          <ReferenceLink<GeoReferenceAssertion>
            baseApiPath="georeference-assertion"
            instanceId={{ typeName: "georeference-assertion", cdoId: relation.id }}
            link={({ literalGeoreferencedBy }) => <span>{literalGeoreferencedBy}</span>}
          />
        )
      );
    }
  }
};
