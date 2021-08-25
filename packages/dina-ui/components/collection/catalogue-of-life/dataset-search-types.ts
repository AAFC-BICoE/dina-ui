export interface CatalogueOfLifeDataSetSearchResult {
  offset?: number;
  limit?: number;
  total?: number;
  result?: DataSetResult[];
  last?: boolean;
  empty?: boolean;
}

export interface DataSetContact {
  city?: string;
  country?: string;
  email?: string;
  name?: string;
  address?: string;
  organisation?: string;
  given?: string;
  family?: string;
  orcid?: string;
}

export interface DataSetCreator {
  orcid?: string;
  given?: string;
  family?: string;
  city?: string;
  country?: string;
  note?: string;
  name?: string;
  address?: string;
  organisation?: string;
  state?: string;
  email?: string;
  department?: string;
}

export interface DataSetPublisher {
  city?: string;
  country?: string;
  name?: string;
  address?: string;
  organisation?: string;
}

export interface DataSetContributor {
  orcid?: string;
  given?: string;
  family?: string;
  note?: string;
  name?: string;
  department?: string;
  city?: string;
  country?: string;
  address?: string;
  organisation?: string;
  state?: string;
}

export interface DataSetEditor {
  given?: string;
  family?: string;
  name?: string;
  email?: string;
  orcid?: string;
}

export interface DataSetResult {
  created?: Date;
  createdBy?: number;
  modified?: Date;
  modifiedBy?: number;
  key?: number;
  sourceKey?: number;
  type?: string;
  origin?: string;
  attempt?: number;
  imported?: Date;
  size?: number;
  doi?: string;
  title?: string;
  alias?: string;
  description?: string;
  issued?: string;
  version?: string;
  issn?: string;
  contact?: DataSetContact;
  creator?: DataSetCreator[];
  publisher?: DataSetPublisher;
  contributor?: DataSetContributor[];
  geographicScope?: string;
  taxonomicScope?: string;
  confidence?: number;
  completeness?: number;
  license?: string;
  url?: string;
  citation?: string;
  private?: boolean;
  logo?: string;
  gbifKey?: string;
  notes?: string;
  editor?: DataSetEditor[];
  temporalScope?: string;
}
