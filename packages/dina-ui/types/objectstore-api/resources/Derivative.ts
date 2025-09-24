import { KitsuResource } from "kitsu";
import { Metadata } from "./Metadata";
import { ObjectUpload } from "./ObjectUpload";

export interface DerivativeAttributes {
  type: "derivative";

  bucket: string;
  filename?: string;
  fileIdentifier: string;
  fileExtension: string;
  dcType: string;
  acHashFunction: string;
  acHashValue: string;
  createdBy: string;
  createdOn: string;
  derivativeType: string;
  acTags?: string[];
  publiclyReleasable?: boolean;
  notPubliclyReleasableReason: any;
}

export interface DerivativeRelationships {
  generatedFromDerivative?: Derivative | KitsuResource | null;
  acDerivedFrom?: Metadata | KitsuResource | null;
  objectUpload?: ObjectUpload | null;
}

export type Derivative = KitsuResource &
  DerivativeAttributes &
  DerivativeRelationships;
