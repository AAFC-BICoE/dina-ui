import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource, KitsuResourceLink } from "kitsu";
import { JsonValue } from "type-fest";
import { AcquisitionEvent } from "..";
import { ManagedAttributeValues, Person } from "../../objectstore-api";
import { CollectingEvent } from "./CollectingEvent";
import { Collection } from "./Collection";
import { Determination } from "./Determination";
import { MaterialSampleType } from "./MaterialSampleType";
import { Organism } from "./Organism";
import { PreparationType } from "./PreparationType";
import { HierarchyItem, StorageUnit } from "./StorageUnit";

export interface MaterialSampleAttributes {
  type: "material-sample";

  // attributes to be added by the back-end:
  materialSampleName?: string;

  group?: string;
  createdOn?: string;
  createdBy?: string;
  dwcOtherCatalogNumbers?: string[];
  preparationMethod?: string | null;
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
  allowDuplicateName?: boolean;

  hostOrganism?: HostOrganism | null;
  associations?: MaterialSampleAssociation[];

  association?: MaterialSampleAssociation;

  stateChangedOn?: string;
  stateChangeRemarks?: string;
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
  preparationAttachment?: ResourceIdentifierObject[];
  preparationType?: PreparationType;
  preparedBy?: Person;
  parentMaterialSample?: MaterialSample;
  storageUnit?: StorageUnit;
  acquisitionEvent?: AcquisitionEvent;
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;
