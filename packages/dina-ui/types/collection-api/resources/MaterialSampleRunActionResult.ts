export interface MaterialSampleRunActionResultAttributes {
  parentSampleId: string;
  childrenGenerated?: {
    id: string;
    name: string;
  }[];
}

export type MaterialSampleRunActionResult =
  MaterialSampleRunActionResultAttributes;
