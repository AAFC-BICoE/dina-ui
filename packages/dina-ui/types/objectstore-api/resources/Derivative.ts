import { KitsuResource } from "kitsu";
import { Metadata } from "./Metadata";
import { ObjectUpload } from "./ObjectUpload";
import { DinaJsonMetaInfo } from "../../DinaJsonMetaInfo";

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

  // Used for permission information included on the request.
  meta?: DinaJsonMetaInfo;
}

export interface DerivativeRelationships {
  generatedFromDerivative?: Derivative | KitsuResource | null;
  acDerivedFrom?: Metadata | KitsuResource | null;
  objectUpload?: ObjectUpload | null;
}

export type Derivative = KitsuResource &
  DerivativeAttributes &
  DerivativeRelationships;
