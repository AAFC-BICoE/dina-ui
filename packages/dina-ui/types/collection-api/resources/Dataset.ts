import { KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";
import { AgentRole } from "../../loan-transaction-api";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

/** The roles an agent can hold on a Dataset, as defined by the back-end DTO. */
export const DATASET_AGENT_ROLES = [
  "creator",
  "metadataProvider",
  "contact",
  "associatedParty",
  "publisher"
] as const;

export type DatasetType = "DWCA";

/** Licence and conditions governing use and redistribution of the dataset. */
export interface UsageRights {
  licenseName?: string;
  licenseUrl?: string;
  usageTerms?: string;
}

/** Keywords describing the dataset, optionally from a controlled vocabulary. */
export interface KeywordSet {
  keywords?: string[];
  thesaurus?: string;
}

export interface BoundingBox {
  west?: number;
  south?: number;
  east?: number;
  north?: number;
}

export interface GeographicCoverage {
  geographicDescription?: string;
  boundingBox?: BoundingBox;
}

export interface TemporalCoverage {
  beginDate?: string;
  endDate?: string;
}

export interface TaxonomicCoverage {
  rank?: string;
  scientificName?: string;
  commonName?: string;
}

/** The spatial, temporal and taxonomic scope of the dataset. */
export interface Coverage {
  geographic?: GeographicCoverage;
  temporal?: TemporalCoverage;
  taxonomic?: TaxonomicCoverage[];
}

/** Sampling procedures and study extent. */
export interface Sampling {
  studyExtent?: string;
  samplingDescription?: string;
}

/** Scientific methods used to collect or produce the dataset. */
export interface Methods {
  methodSteps?: string[];
  sampling?: Sampling;
  qualityControlDescriptions?: string[];
}

/** Structured funding award information. */
export interface Award {
  funderName?: string;
  funderIdentifiers?: string[];
  awardNumber?: string;
  title?: string;
  awardUrl?: string;
}

/**
 * The project associated with the dataset. Named DatasetProject to avoid
 * colliding with the collection-api Project resource.
 */
export interface DatasetProject {
  title?: string;
  abstractText?: string;
  funding?: string;
  personnel?: AgentRole[];
  awards?: Award[];
  studyAreaDescription?: string;
  designDescription?: string;
}

export interface DatasetAttributes {
  type: "dataset";
  datasetVersion?: string;
  publicationDate?: string;
  group?: string;
  multilingualTitle?: MultilingualTitle;
  multilingualDescription?: MultilingualDescription;
  datasetType?: DatasetType;
  agentRoles?: AgentRole[];
  usageRights?: UsageRights;
  keywordSets?: KeywordSet[];
  coverage?: Coverage;
  methods?: Methods;
  project?: DatasetProject;
  createdOn?: string;
  createdBy?: string;
}

export type Dataset = KitsuResource & DatasetAttributes & HasDinaMetaInfo;
