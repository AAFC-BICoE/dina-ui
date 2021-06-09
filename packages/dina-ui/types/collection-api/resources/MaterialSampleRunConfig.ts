export interface MaterialSampleRunConfigMetadata {
  runby?: string;
  dateCreated?: string;
  actionRemarks: string;
}

export interface MaterialSampleRunConfigConfiguration {
  numOfChildToCreate: string;
  baseName: string;
  start?: string;
  type: string;
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

export type MaterialSampleRunConfig = MaterialSampleRunConfigAttributes;
