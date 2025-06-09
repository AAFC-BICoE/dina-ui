export interface GlobalNamesSearchResult {
  inputId: string;
  input: string;
  matchType: string;
  bestResult: BestResult;
  dataSourcesNum: number;
  curation: string;
}

export interface GlobalNamesDatasetsResult {
  id: number;
  titleShort: string;
  title: string;
  hasTaxonData: boolean;
}

export interface BestResult {
  dataSourceId: number;
  dataSourceTitleShort: string;
  curation: string;
  recordId: string;
  outlink: string;
  entryDate: string;
  matchedName: string;
  matchedCardinality: number;
  matchedCanonicalSimple: string;
  matchedCanonicalFull: string;
  currentRecordId: string;
  currentName: string;
  currentCardinality: number;
  currentCanonicalSimple: string;
  currentCanonicalFull: string;
  isSynonym: false;
  classificationPath: string;
  classificationRanks: string;
  classificationIds: string;
  editDistance: number;
  stemEditDistance: number;
  matchType: string;
}
