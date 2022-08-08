export interface MultilingualDescription {
  descriptions?: MultilingualDescriptionPair[] | null;
}

export interface MultilingualDescriptionPair {
  lang?: string | null;
  desc?: string | null;
}
