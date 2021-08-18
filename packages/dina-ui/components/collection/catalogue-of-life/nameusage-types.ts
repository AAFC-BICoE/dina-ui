export interface NameUsageSearchResult {
  offset?: number;
  limit?: number;
  total?: number;
  result?: Result[];
  last?: boolean;
  empty?: boolean;
}

export interface CombinationAuthorship {
  authors?: string[];
}

export interface Name {
  created?: Date;
  createdBy?: number;
  modified?: Date;
  modifiedBy?: number;
  datasetKey?: number;
  id?: string;
  sectorKey?: number;
  homotypicNameId?: string;
  scientificName?: string;
  authorship?: string;
  rank?: string;
  genus?: string;
  specificEpithet?: string;
  combinationAuthorship?: CombinationAuthorship;
  code?: string;
  publishedInId?: string;
  origin?: string;
  type?: string;
  parsed?: boolean;
  nomStatus?: string;
  nomenclaturalNote?: string;
}

export interface Accepted {
  created?: Date;
  createdBy?: number;
  modified?: Date;
  modifiedBy?: number;
  datasetKey?: number;
  id?: string;
  sectorKey?: number;
  name?: Name;
  status?: string;
  origin?: string;
  parentId?: string;
  scrutinizer?: string;
  scrutinizerDate?: string;
  extinct?: boolean;
  label?: string;
  labelHtml?: string;
}

export interface Result {
  created?: Date;
  createdBy?: number;
  modified?: Date;
  modifiedBy?: number;
  datasetKey?: number;
  id?: string;
  sectorKey?: number;
  name?: Name;
  status?: string;
  origin?: string;
  parentId?: string;
  accepted?: Accepted;
  homotypic?: boolean;
  label?: string;
  labelHtml?: string;
}
