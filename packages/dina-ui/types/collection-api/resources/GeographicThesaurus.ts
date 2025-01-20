export interface GeographicThesaurus {
  subjectId: string;
  preferredTerm: string;
  preferredParent?: string;
  additionalParents?: string[];
}

export enum GeographicThesaurusSource {
  TGN = "TGN"
}
