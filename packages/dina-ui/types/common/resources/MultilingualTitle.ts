export interface MultilingualTitle {
  titles?: MultilingualTitlePair[] | null;
}

export interface MultilingualTitlePair {
  lang?: string | null;
  title?: string | null;
}
