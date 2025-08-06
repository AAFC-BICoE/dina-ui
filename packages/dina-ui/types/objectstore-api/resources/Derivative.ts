import { KitsuResource } from "kitsu";
import { Metadata } from "./Metadata";
import { ObjectUpload } from "./ObjectUpload";

export interface DerivativeAttributes {
  type: "derivative";

  bucket: string;
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

export function derivativeParser(derivative) {
  derivative.generatedFromDerivative = derivative.generatedFromDerivative?.data;
  derivative.acDerivedFrom = derivative.acDerivedFrom?.data;
  derivative.objectUpload = derivative.objectUpload?.data;

  return derivative;
}
