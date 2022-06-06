import { ResourceIdentifierObject } from "jsonapi-typescript";
import { InputResource, KitsuResource, KitsuResourceLink } from "kitsu";
import { BLANK_PREPARATION, BLANK_RESTRICTION } from "../../../components";
import { ManagedAttributeValues, Person } from "../../objectstore-api";
import { AcquisitionEvent } from "./AcquisitionEvent";
import { CollectingEvent } from "./CollectingEvent";
import { Collection } from "./Collection";
import { ExtensionValue } from "./FieldExtension";
import { MaterialSampleType } from "./MaterialSampleType";
import { Organism } from "./Organism";
import { PreparationType } from "./PreparationType";
import { Project } from "./Project";
import { HierarchyItem, StorageUnit } from "./StorageUnit";

/**
 * All Material Sample form sections in order.
 * This array is the source of truth for the section ID names and their order.
 */
export const MATERIAL_SAMPLE_FORM_SECTIONS = [
  "identifiers-section",
  "material-sample-info-section",
  "collecting-event-section",
  "acquisition-event-section",
  "preparations-section",
  "organisms-section",
  "associations-section",
  "storage-section",
  "restriction-section",
  "scheduled-actions-section",
  "managedAttributes-section",
  "material-sample-attachments-section"
] as const;

export type MaterialSampleFormSectionId =
  typeof MATERIAL_SAMPLE_FORM_SECTIONS[number];

export interface MaterialSampleAttributes {
  type: "material-sample";

  materialSampleName?: string;

  group?: string;
  createdOn?: string;
  createdBy?: string;
  dwcOtherCatalogNumbers?: string[];
  preparationMethod?: string | null;
  preservationType?: string | null;
  preparationFixative?: string | null;
  preparationMaterials?: string | null;
  preparationSubstrate?: string | null;
  preparationDate?: string | null;
  preparationRemarks?: string | null;
  description?: string;
  dwcDegreeOfEstablishment?: string | null;

  managedAttributes?: ManagedAttributeValues;

  hierarchy?: HierarchyItem[];

  barcode?: string;

  materialSampleState?: string;
  materialSampleRemarks?: string;
  materialSampleType?: MaterialSampleType;
  organism?: (Organism | null | undefined)[] | null;

  // Client-side only fields for the organism section:
  organismsQuantity?: number;
  organismsIndividualEntry?: boolean;

  publiclyReleasable?: boolean | null;
  notPubliclyReleasableReason?: string;
  materialSampleChildren?: Partial<MaterialSample>[];
  tags?: string[];

  scheduledActions?: ScheduledAction[];
  allowDuplicateName?: boolean;

  hostOrganism?: HostOrganism | null;
  associations?: MaterialSampleAssociation[];

  stateChangedOn?: string;
  stateChangeRemarks?: string;

  useNextSequence?: boolean;

  restrictionFieldsExtension?: ExtensionValue[] | null;

  phac_human_rg?: ExtensionValue | null;
  phac_cl?: ExtensionValue | null;
  phac_animal_rg?: ExtensionValue | null;
  cfia_ppc?: ExtensionValue | null;

  isRestricted?: boolean;
  restrictionRemarks?: string | null;
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
  collectingEvent?: CollectingEvent;
  attachment?: ResourceIdentifierObject[];
  preparationProtocol?: ResourceIdentifierObject;
  preparationType?: PreparationType;
  preparedBy?: Person;
  parentMaterialSample?: MaterialSample;
  storageUnit?: StorageUnit;
  projects?: Project[];
  acquisitionEvent?: AcquisitionEvent;
}

export function blankMaterialSample(): Partial<InputResource<MaterialSample>> {
  return {
    ...BLANK_PREPARATION,
    ...BLANK_RESTRICTION,
    associations: [],
    hostOrganism: null,
    organism: []
  };
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;
