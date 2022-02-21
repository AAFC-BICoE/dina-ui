import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";

interface AcquisitionEventAttributes {
  type: "acquisition-event";
  createdOn?: string;
  createdBy?: string;
  group?: string;
  receivedDate?: string;
  receptionRemarks?: string;
  isolatedOn?: string;
  isolationRemarks?: string;
}

interface AcquisitionEventRelationships {
  receivedFrom?: Person;
  isolatedBy?: Person;
}

export type AcquisitionEvent = KitsuResource &
  AcquisitionEventAttributes &
  AcquisitionEventRelationships;
