export interface CatalogueOfLifeNameSearchResult {
  name?: CatalogueOfLifeName;
  type?: string;
  alternatives?: CatalogueOfLifeName[];
  nameKey?: number;
}

export interface CatalogueOfLifeName {
  created?: string;
  modified?: string;
  canonicalId?: number;
  scientificName?: string;
  rank?: string;
  genus?: string;
  specificEpithet?: string;
  labelHtml?: string;
  parsed?: true;
  id?: number;
  authorship?: string;
  canonical?: boolean;
  combinationAuthorship?: {
    authors?: string[];
  };
}
