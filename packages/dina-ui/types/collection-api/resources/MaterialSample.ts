import { ResourceIdentifierObject } from "jsonapi-typescript";
import { InputResource, KitsuResource, KitsuResourceLink } from "kitsu";
import { BLANK_PREPARATION, BLANK_RESTRICTION } from "../../../components";
import { ManagedAttributeValues } from "./ManagedAttribute";
import { Assemblage } from "./Assemblage";
import { CollectingEvent } from "./CollectingEvent";
import { Collection } from "./Collection";
import { ExtensionValue } from "./FieldExtension";
import { MaterialSampleType } from "./MaterialSampleType";
import { Organism } from "./Organism";
import { PreparationType } from "./PreparationType";
import { Project } from "./Project";
import { HierarchyItem, StorageUnit } from "./StorageUnit";
import { Person } from "../../objectstore-api";
import { StorageUnitUsage } from "./StorageUnitUsage";

export interface MaterialSampleAttributes {
  type: "material-sample";

  materialSampleName?: string;

  group?: string;
  createdOn?: string;
  createdBy?: string;
  sourceSet?: string;
  dwcOtherCatalogNumbers?: string[];
  identifiers?: { [identifierType: string]: string };
  preservationType?: string | null;
  preparationFixative?: string | null;
  preparationMaterials?: string | null;
  preparationSubstrate?: string | null;
  preparationDate?: string | null;
  preparationRemarks?: string | null;
  description?: string;
  dwcDegreeOfEstablishment?: string | null;
  preparationManagedAttributes?: ManagedAttributeValues;

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
  useTargetOrganism?: boolean;
  storageUnit?: StorageUnit;

  publiclyReleasable?: boolean | null;
  notPubliclyReleasableReason?: string;
  materialSampleChildren?: Partial<MaterialSampleChildren>[];
  tags?: string[];

  scheduledActions?: ScheduledAction[];
  allowDuplicateName?: boolean;

  hostOrganism?: HostOrganism | null;
  associations?: MaterialSampleAssociation[];

  stateChangedOn?: string;
  stateChangeRemarks?: string;

  useNextSequence?: boolean;

  restrictionFieldsExtension?: any | null;

  phac_human_rg?: ExtensionValue | null;
  phac_cl?: ExtensionValue | null;
  phac_animal_rg?: ExtensionValue | null;
  cfia_ppc?: ExtensionValue | null;

  isRestricted?: boolean;
  restrictionRemarks?: string | null;
  extensionValues?: any;
  version?: string;

  // Client side for parent attributes
  parentAttributes?: any;
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
  preparationMethod?: ResourceIdentifierObject;
  preparationType?: PreparationType;
  preparedBy?: Person[];
  parentMaterialSample?: MaterialSample;
  projects?: Project[];
  assemblages?: Assemblage[];
  storageUnitUsage?: StorageUnitUsage;
}

interface MaterialSampleChildren extends MaterialSample {
  ordinal: number;
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

export interface MaterialSampleResponse {
  id: string;
  type: "material-sample";
  attributes?: MaterialSampleResponseAttributes;
  relationships?: MaterialSampleResponseRelationships;
}

export interface MaterialSampleResponseAttributes {
  // Required fields
  materialSampleName: string;
  group: string;
  createdOn: string;
  createdBy: string;

  // Optional core fields
  sourceSet?: string;
  dwcCatalogNumber?: string;
  dwcOtherCatalogNumbers?: string[];

  // Identifiers
  identifiers?: Record<string, string>;
  barcode?: string;

  // State and status with specific values
  materialSampleState?: string;
  materialSampleRemarks?: string;

  // Preparation fields
  preservationType?: string | null;
  preparationFixative?: string | null;
  preparationMaterials?: string | null;
  preparationSubstrate?: string | null;
  preparationDate?: string | null; // ISO date string
  preparationRemarks?: string | null;

  // Descriptive fields
  description?: string;

  // DwC fields
  dwcDegreeOfEstablishment?:
    | "native"
    | "introduced"
    | "cultivated"
    | "invasive"
    | "uncertain"
    | null;

  // Managed attributes (API returns as object)
  managedAttributes?: Record<string, any>;
  preparationManagedAttributes?: Record<string, any>;

  // Privacy and restrictions
  publiclyReleasable?: boolean;
  notPubliclyReleasableReason?: string;
  isRestricted?: boolean;
  restrictionRemarks?: string;

  // Extension fields
  phac_human_rg?: ExtensionValue | null;
  phac_cl?: ExtensionValue | null;
  phac_animal_rg?: ExtensionValue | null;
  cfia_ppc?: ExtensionValue | null;
  restrictionFieldsExtension?: Record<string, any> | null;
  extensionValues?: Record<string, any>;

  // Metadata
  version?: string;
  tags?: string[];

  // State tracking
  stateChangedOn?: string; // ISO date string
  stateChangeRemarks?: string;

  // Host organism (structured)
  hostOrganism?: HostOrganism | null;

  // Associations (array of structured objects)
  associations?: MaterialSampleAssociation[];

  // Scheduled actions
  scheduledActions?: ScheduledAction[];

  // Hierarchy (if returned as attributes)
  hierarchy?: HierarchyItem[];
}

// Relationships as they come from API
export interface MaterialSampleResponseRelationships {
  collection?: {
    data?: Collection;
  };
  collectingEvent?: {
    data?: CollectingEvent;
  };
  attachment?: {
    data?: ResourceIdentifierObject[];
  };
  preparationProtocol?: {
    data?: ResourceIdentifierObject;
  };
  preparationMethod?: {
    data?: ResourceIdentifierObject;
  };
  preparationType?: {
    data?: PreparationType;
  };
  preparedBy?: {
    data?: Person[];
  };
  parentMaterialSample?: {
    data?: MaterialSample;
  };
  projects?: {
    data?: Project[];
  };
  assemblages?: {
    data?: Assemblage[];
  };
  storageUnitUsage?: {
    data?: StorageUnitUsage;
  };
  organism?: {
    data?: (Organism | undefined)[];
  };
  materialSampleType?: {
    data?: MaterialSampleType;
  };
  storageUnit?: {
    data?: StorageUnit;
  };
}

/**
 * Parses the relationships object from a material sample API response and extracts
 * the relationship data.
 *
 * @param relationships - The relationships object from the material sample API response.
 * @returns An object containing the relationship data.
 */
export function MaterialSampleRelationshipParser(
  relationships: MaterialSampleResponseRelationships
): MaterialSampleRelationships {
  return {
    collection: relationships.collection?.data,
    collectingEvent: relationships.collectingEvent?.data,
    attachment: relationships.attachment?.data,
    preparationProtocol: relationships.preparationProtocol?.data,
    preparationMethod: relationships.preparationMethod?.data,
    preparationType: relationships.preparationType?.data,
    preparedBy: relationships.preparedBy?.data,
    parentMaterialSample: relationships.parentMaterialSample?.data,
    projects: relationships.projects?.data,
    assemblages: relationships.assemblages?.data,
    storageUnitUsage: relationships.storageUnitUsage?.data
  };
}

/**
 * Parses a MaterialSampleResponse object and transforms it into a MaterialSample object.
 *
 * @param materialSample - The MaterialSampleResponse object to parse.
 * @returns The parsed MaterialSample object, including its attributes and relationships.
 */
// export function MaterialSampleParser(
//   materialSample: MaterialSampleResponse
// ): MaterialSample {
//   const relationships = materialSample.relationships ? MaterialSampleRelationshipParser(materialSample.relationships) : {};
//   // Attributes that are handled as relationships in the API response.
//   const nonRelationshipAttributes = {
//     organism: materialSample.relationships?.organism?.data,
//     materialSampleType: materialSample.relationships?.materialSampleType?.data,
//     storageUnit: materialSample.relationships?.storageUnit?.data
//   }

//   const parsedMaterialSample: MaterialSample = {
//     id: materialSample.id,
//     type: materialSample.type,
//     ...(materialSample.attributes || {}),
//     ...relationships,
//     ...nonRelationshipAttributes
//   };

//   return parsedMaterialSample;
// }

export function materialSampleParser(materialSample) {
  materialSample.collection = materialSample.collection?.data;
  materialSample.collectingEvent = materialSample.collectingEvent?.data;
  materialSample.attachment = materialSample.attachment?.data;
  materialSample.preparationProtocol = materialSample.preparationProtocol?.data;
  materialSample.preparationMethod = materialSample.preparationMethod?.data;
  materialSample.preparationType = materialSample.preparationType?.data;
  materialSample.preparedBy = materialSample.preparedBy?.data;
  materialSample.parentMaterialSample =
    materialSample.parentMaterialSample?.data;
  materialSample.projects = materialSample.projects?.data;
  materialSample.assemblages = materialSample.assemblages?.data;
  materialSample.storageUnitUsage = materialSample.storageUnitUsage?.data;
  materialSample.organism = materialSample.organism?.data;
  materialSample.materialSampleType = materialSample.materialSampleType?.data;
  materialSample.storageUnit = materialSample.storageUnit?.data;

  return materialSample;
}
