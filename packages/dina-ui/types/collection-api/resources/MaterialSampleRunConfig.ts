export interface MaterialSampleRunConfigMetadata {
  runby?: string;
  dateCreated?: string;
  actionRemarks: string;
}

export interface MaterialSampleRunConfigConfiguration {
  numOfChildToCreate: number;
  baseName: string;
  start?: string | undefined;
  suffixType: string | undefined;
  destroyOriginal: boolean;
}

export interface MaterialSampleRunConfigChildConfiguration {
  sampleNames?: string[];
  sampleDescs?: string[];
}

export interface MaterialSampleRunConfigAttributes {
  metadata: MaterialSampleRunConfigMetadata;
  configure: MaterialSampleRunConfigConfiguration;
  configure_children?: MaterialSampleRunConfigChildConfiguration;
}

export const BASE_NAME = "ParentName";
export const START = "001";
export const TYPE_NUMERIC = "Numerical";
export const TYPE_LETTER = "Letter";

export type MaterialSampleRunConfig = MaterialSampleRunConfigAttributes;
