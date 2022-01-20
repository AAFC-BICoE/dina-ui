import { AcquisitionEvent } from "../../../types/collection-api";
import { Person } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const ACQUISITION_EVENT_REVISION_ROW_CONFIG: RevisionRowConfig<AcquisitionEvent> =
  {
    customValueCells: {
      receivedFrom: ({ original: { value } }) => (
        <ReferenceLink<Person>
          baseApiPath="agent-api"
          type="person"
          reference={value}
          name={person => person.displayName}
          href="/person/view?id="
        />
      ),
      isolatedBy: ({ original: { value } }) => (
        <ReferenceLink<Person>
          baseApiPath="agent-api"
          type="person"
          reference={value}
          name={person => person.displayName}
          href="/person/view?id="
        />
      )
    }
  };
