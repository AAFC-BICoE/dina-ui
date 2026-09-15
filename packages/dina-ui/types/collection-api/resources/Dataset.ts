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

/** The dataset types the back-end currently supports. */
export const DATASET_TYPES = ["DWCA"] as const;

export type DatasetType = (typeof DATASET_TYPES)[number];

/** Licence and conditions governing use and redistribution of the dataset. */
export interface DatasetUsageRights {
  licenseName?: string;
  licenseUrl?: string;
  usageTerms?: string;
}

/** Keywords describing the dataset, optionally from a controlled vocabulary. */
export interface DatasetKeywordSet {
  keywords?: string[];
  thesaurus?: string;
}

export interface DatasetBoundingBox {
  west?: number;
  south?: number;
  east?: number;
  north?: number;
}

export interface DatasetGeographicCoverage {
  geographicDescription?: string;
  boundingBox?: DatasetBoundingBox;
}

export interface DatasetTemporalCoverage {
  beginDate?: string;
  endDate?: string;
}

export interface DatasetTaxonomicCoverage {
  rank?: string;
  scientificName?: string;
  commonName?: string;
}

/** The spatial, temporal and taxonomic scope of the dataset. */
export interface DatasetCoverage {
  geographic?: DatasetGeographicCoverage;
  temporal?: DatasetTemporalCoverage;
  taxonomic?: DatasetTaxonomicCoverage[];
}

/** Sampling procedures and study extent. */
export interface DatasetSampling {
  studyExtent?: string;
  samplingDescription?: string;
}

/** Scientific methods used to collect or produce the dataset. */
export interface DatasetMethods {
  methodSteps?: string[];
  sampling?: DatasetSampling;
  qualityControlDescriptions?: string[];
}

/** Structured funding award information. */
export interface DatasetAward {
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
  awards?: DatasetAward[];
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
  usageRights?: DatasetUsageRights;
  keywordSets?: DatasetKeywordSet[];
  coverage?: DatasetCoverage;
  methods?: DatasetMethods;
  project?: DatasetProject;
  createdOn?: string;
  createdBy?: string;
}

export type Dataset = KitsuResource & DatasetAttributes & HasDinaMetaInfo;
