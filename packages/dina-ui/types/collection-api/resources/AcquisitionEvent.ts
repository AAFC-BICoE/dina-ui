import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";

interface AcquisitionEventAttributes {
  type: "acquisition-event";
  createdOn?: string;
  createdBy?: string;
  group?: string;
  receivedDate?: string;
  receptionRemarks?: string;
  externallyIsolatedOn?: string;
  externallyIsolationRemarks?: string;
}

interface AcquisitionEventRelationships {
  receivedFrom?: Person;
  externallyIsolatedBy?: Person;
}

export type AcquisitionEvent = KitsuResource &
  AcquisitionEventAttributes &
  AcquisitionEventRelationships;
