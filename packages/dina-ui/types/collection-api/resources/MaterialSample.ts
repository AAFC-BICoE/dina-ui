import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { ManagedAttributeValues, Person } from "../../objectstore-api";
import { CollectingEvent } from "./CollectingEvent";
import { PreparationType } from "./PreparationType";
import { JsonValue } from "type-fest";
import { MaterialSampleType } from "./MaterialSampleType";
import { StorageUnit } from "./StorageUnit";
import { Determination } from "./Determination";

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
  preparationRemarks?: string | null;
  description?: string;
  dwcDegreeOfEstablishment?: string | null;

  managedAttributeValues?: ManagedAttributeValues;
  managedAttributes?: JsonValue;

  determination?: Determination[];
}

export interface MaterialSampleRelationships {
  materialSampleType?: MaterialSampleType;
  collectingEvent?: CollectingEvent;
  attachment?: ResourceIdentifierObject[];
  preparationType?: PreparationType;
  preparedBy?: Person;
  parentMaterialSample?: MaterialSample;
  storageUnit?: StorageUnit;
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;
