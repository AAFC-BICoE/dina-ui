import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { ManagedAttributeValues, Person } from "../../objectstore-api";
import { CollectingEvent } from "./CollectingEvent";
import { PreparationType } from "./PreparationType";

export interface MaterialSampleAttributes {
  type: "material-sample";

  // attributes to be added by the back-end:
  materialSampleName?: string;

  group?: string;
  createdOn?: string;
  createdBy?: string;
  dwcCatalogNumber?: string | null;
  dwcOtherCatalogNumbers?: string[];
  preparationDate?: string | null;

  managedAttributeValues?: ManagedAttributeValues;
}

export interface MaterialSampleRelationships {
  collectingEvent?: CollectingEvent;
  attachment?: ResourceIdentifierObject[];
  preparationType?: PreparationType;
  preparedBy?: Person;
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;
