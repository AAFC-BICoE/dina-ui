import { KitsuResource } from "kitsu";
import { Metadata } from "./Metadata";

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
}

export interface DerivativeRelationships {
  generatedFromDerivative?: Derivative | KitsuResource | null;
  acDerivedFrom?: Metadata | KitsuResource | null;
}

export type Derivative = KitsuResource &
  DerivativeAttributes &
  DerivativeRelationships;
