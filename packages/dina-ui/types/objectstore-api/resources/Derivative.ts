import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
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
  notPubliclyReleasableReason?: string;
}

export interface DerivativeRelationships {
  generatedFromDerivative?: Derivative | null;
  acDerivedFrom?: Metadata | null;
  objectUpload?: ObjectUpload | null;
}

export type Derivative = KitsuResource &
  DerivativeAttributes &
  DerivativeRelationships;

// Response types (what comes from API)
export interface DerivativeResponseAttributes {
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
  notPubliclyReleasableReason?: string;
}

export interface DerivativeResponseRelationships {
  generatedFromDerivative?: {
    data?: PersistedResource<Derivative>;
  };
  acDerivedFrom?: {
    data?: PersistedResource<Metadata>;
  };
  objectUpload?: {
    data?: PersistedResource<ObjectUpload>;
  };
}

export type DerivativeResponse = KitsuResource &
  DerivativeResponseAttributes &
  DerivativeResponseRelationships;

/**
 * Parses a `PersistedResource<DerivativeResponse>` object and transforms it into a `PersistedResource<Derivative>`.
 *
 * This function omits specific relationship properties from the input derivative and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<DerivativeResponse>`.
 * @returns The parsed derivative resource, of type `PersistedResource<Derivative>`.
 */
export function derivativeParser(
  data: PersistedResource<DerivativeResponse>
): PersistedResource<Derivative> {
  const parsedDerivative = baseRelationshipParser(
    ["generatedFromDerivative", "acDerivedFrom", "objectUpload"],
    data
  ) as PersistedResource<Derivative>;

  return parsedDerivative;
}
