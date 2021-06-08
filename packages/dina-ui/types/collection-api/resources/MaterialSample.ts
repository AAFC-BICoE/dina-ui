import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { ManagedAttributeValues } from "../../objectstore-api";
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

  managedAttributeValues?: ManagedAttributeValues;

  /* Config action related fields */
  numberOfChildSamples: number;
  baseName: string;
  start: string;
  customChildSampleNames?: { index: number; name: string }[];

  /** Template related boolean fields for preparation and catalogued info section */
  preparationTypeEnabled?: boolean;
  preparedByEnabled?: boolean;
  datePreparedEnabled?: boolean;

  dwcCatalogNumberEnabled?: boolean;

  materialSampleAllowNew?: boolean;
  materialSampleAllowExisting?: boolean;
}

export interface MaterialSampleRelationships {
  collectingEvent?: CollectingEvent;
  attachment?: ResourceIdentifierObject[];
  preparationType?: PreparationType;
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;
