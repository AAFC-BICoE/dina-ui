import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";

interface AcquisitionEventAttributes {
  type: "acquisition-event";
  createdOn?: string;
  createdBy?: string;
  group?: string;
  receivedDate?: string;
  receptionRemarks?: string;
  externallyIsolatedBy?: string;
  externallyIsolatedOn?: string;
  externallyIsolationRemarks?: string;
}

interface AcquisitionEventRelationships {
  receivedFrom?: Person;
}

export type AcquisitionEvent = KitsuResource &
  AcquisitionEventAttributes &
  AcquisitionEventRelationships;
