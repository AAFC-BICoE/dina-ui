export interface MaterialSampleRunConfigAttributes {
  numOfChildToCreate: string;
  baseName: string;
  start?: string;
  sampleName?: string[];
  description?: string[];
  type: string;
}

export type MaterialSampleRunConfig = MaterialSampleRunConfigAttributes;
