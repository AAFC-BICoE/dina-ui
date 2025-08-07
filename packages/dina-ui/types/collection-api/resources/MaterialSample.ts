import {
  KitsuResource,
  KitsuResourceLink,
  PersistedResource,
  InputResource
} from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { Person } from "../../objectstore-api";
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
import { StorageUnitUsage } from "./StorageUnitUsage";
import { omit } from "lodash";

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

  // Client-side only fields for the organism section:
  organismsQuantity?: number;
  organismsIndividualEntry?: boolean;
  useTargetOrganism?: boolean;

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
  organism?: (Organism | null | undefined)[] | null;
  materialSampleType?: MaterialSampleType;
  storageUnit?: StorageUnit;
}

interface MaterialSampleChildren extends MaterialSample {
  ordinal: number;
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;

// Response types (what comes from API)
export interface MaterialSampleResponseAttributes {
  type: "material-sample";

  materialSampleName?: string;

  group?: string;
  createdOn?: string;
  createdBy?: string;
  sourceSet?: string;
  dwcCatalogNumber?: string;
  dwcOtherCatalogNumbers?: string[];

  identifiers?: Record<string, string>;
  barcode?: string;

  materialSampleState?: string;
  materialSampleRemarks?: string;

  preservationType?: string | null;
  preparationFixative?: string | null;
  preparationMaterials?: string | null;
  preparationSubstrate?: string | null;
  preparationDate?: string | null;
  preparationRemarks?: string | null;

  description?: string;

  dwcDegreeOfEstablishment?:
    | "native"
    | "introduced"
    | "cultivated"
    | "invasive"
    | "uncertain"
    | null;

  managedAttributes?: Record<string, any>;
  preparationManagedAttributes?: Record<string, any>;

  publiclyReleasable?: boolean;
  notPubliclyReleasableReason?: string;
  isRestricted?: boolean;
  restrictionRemarks?: string;

  phac_human_rg?: ExtensionValue | null;
  phac_cl?: ExtensionValue | null;
  phac_animal_rg?: ExtensionValue | null;
  cfia_ppc?: ExtensionValue | null;
  restrictionFieldsExtension?: Record<string, any> | null;
  extensionValues?: Record<string, any>;

  version?: string;
  tags?: string[];

  stateChangedOn?: string;
  stateChangeRemarks?: string;

  hostOrganism?: HostOrganism | null;
  associations?: MaterialSampleAssociation[];
  scheduledActions?: ScheduledAction[];
  hierarchy?: HierarchyItem[];
}

export interface MaterialSampleResponseRelationships {
  collection?: {
    data?: PersistedResource<Collection>;
  };
  collectingEvent?: {
    data?: PersistedResource<CollectingEvent>;
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
    data?: PersistedResource<PreparationType>;
  };
  preparedBy?: {
    data?: PersistedResource<Person>[];
  };
  parentMaterialSample?: {
    data?: PersistedResource<MaterialSample>;
  };
  projects?: {
    data?: PersistedResource<Project>[];
  };
  assemblages?: {
    data?: PersistedResource<Assemblage>[];
  };
  storageUnitUsage?: {
    data?: PersistedResource<StorageUnitUsage>;
  };
  organism?: {
    data?: PersistedResource<Organism>[];
  };
  materialSampleType?: {
    data?: MaterialSampleType;
  };
  storageUnit?: {
    data?: PersistedResource<StorageUnit>;
  };
}

export type MaterialSampleResponse = KitsuResource &
  MaterialSampleResponseAttributes &
  MaterialSampleResponseRelationships;

/**
 * Parses a `PersistedResource<MaterialSampleResponse>` object and transforms it into a `PersistedResource<MaterialSample>`.
 *
 * This function omits specific relationship properties from the input material sample and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MaterialSampleResponse>`.
 * @returns The parsed material sample resource, of type `PersistedResource<MaterialSample>`.
 */
export function materialSampleParser(
  data: PersistedResource<MaterialSampleResponse>
): PersistedResource<MaterialSample> {
  const parsedMaterialSample: PersistedResource<MaterialSample> = {
    ...omit(data, [
      "collection",
      "collectingEvent",
      "attachment",
      "preparationProtocol",
      "preparationMethod",
      "preparationType",
      "preparedBy",
      "parentMaterialSample",
      "projects",
      "assemblages",
      "storageUnitUsage",
      "organism",
      "materialSampleType",
      "storageUnit"
    ]),
    collection: data.collection?.data,
    collectingEvent: data.collectingEvent?.data,
    attachment: data.attachment?.data,
    preparationProtocol: data.preparationProtocol?.data,
    preparationMethod: data.preparationMethod?.data,
    preparationType: data.preparationType?.data,
    preparedBy: data.preparedBy?.data,
    parentMaterialSample: data.parentMaterialSample?.data,
    projects: data.projects?.data,
    assemblages: data.assemblages?.data,
    storageUnitUsage: data.storageUnitUsage?.data,
    organism: data.organism?.data,
    materialSampleType: data.materialSampleType?.data,
    storageUnit: data.storageUnit?.data
  };
  return parsedMaterialSample;
}

export function blankMaterialSample(): Partial<InputResource<MaterialSample>> {
  return {
    associations: [],
    hostOrganism: null,
    organism: []
  };
}
