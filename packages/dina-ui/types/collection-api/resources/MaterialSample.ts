import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource, KitsuResourceLink } from "kitsu";
import { ManagedAttributeValues, Person } from "../../objectstore-api";
import { CollectingEvent } from "./CollectingEvent";
import { PreparationType } from "./PreparationType";
import { JsonValue } from "type-fest";
import { MaterialSampleType } from "./MaterialSampleType";
import { HierarchyItem, StorageUnit } from "./StorageUnit";
import { Determination } from "./Determination";
import { Collection } from "./Collection";
import { Organism } from "./Organism";

export interface MaterialSampleAttributes {
  type: "material-sample";

  // attributes to be added by the back-end:
  materialSampleName?: string;

  group?: string;
  createdOn?: string;
  createdBy?: string;
  dwcOtherCatalogNumbers?: string[];
  preparationDate?: string | null;
  preparationRemarks?: string | null;
  description?: string;
  dwcDegreeOfEstablishment?: string | null;

  managedAttributeValues?: ManagedAttributeValues;
  managedAttributes?: JsonValue;

  determination?: Determination[];
  hierarchy?: HierarchyItem[];

  barcode?: string;

  materialSampleState?: string;
  materialSampleRemarks?: string;

  organism?: Organism;
  publiclyReleasable?: boolean;
  notPubliclyReleasableReason?: string;
  materialSampleChildren?: Partial<MaterialSample>[];
  tags?: string[];

  scheduledActions?: ScheduledAction[];

  hostOrganism?: HostOrganism;
  associations?: MaterialSampleAssociation[];

  association?: MaterialSampleAssociation;
}

export interface HostOrganism {
  name?: string;
  remarks?: string;
}

export interface MaterialSampleAssociation {
  associatedSample?: string;
  associationType?: string;
  remarks?: string;
}

export interface ScheduledAction {
  actionType?: string;
  date?: string;
  actionStatus?: string;
  assignedTo?: KitsuResourceLink;
  remarks?: string;
}

export interface MaterialSampleRelationships {
  collection?: Collection;
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
