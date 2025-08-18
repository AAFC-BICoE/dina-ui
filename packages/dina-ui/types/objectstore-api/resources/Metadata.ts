import { KitsuResource, PersistedResource } from "kitsu";
import { Person } from "../../agent-api/resources/Person";
import { DinaJsonMetaInfo } from "../../DinaJsonMetaInfo";
import { Derivative } from "./Derivative";
import { License } from "./License";
import { DcType, ObjectUpload } from "./ObjectUpload";
import { baseRelationshipParser } from "../../baseRelationshipParser";
export interface MetadataAttributes {
  type: "metadata";
  bucket: string;
  fileIdentifier?: string;
  fileExtension?: string;

  /** Refers to the License/LicenseDTO's 'url' field. */
  xmpRightsWebStatement?: string;
  xmpRightsUsageTerms?: string;
  xmpRightsOwner?: string;

  // Client-side only fields, delete before submitting to back-end
  license?: License;

  // optional fields
  group?: string;
  dcRights?: string;
  acSubtype?: string;
  dcType?: DcType;
  acCaption?: string;
  dcFormat?: string;
  createdOn?: string;
  acDigitizationDate?: string | null;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;
  notPubliclyReleasableReason?: string;
  publiclyReleasable?: boolean;
  orientation?: number;

  acHashFunction?: string;
  acHashValue?: string;

  resourceExternalURL?: string;

  // Used for permission information included on the request.
  meta?: DinaJsonMetaInfo;
}

export interface MetadataRelationships {
  acMetadataCreator?: Person | KitsuResource;
  dcCreator?: Person | KitsuResource | null;
  managedAttributes?: Record<string, string | null | undefined>;
  derivatives?:
    | PersistedResource<Derivative & { objectUpload: ObjectUpload }>[]
    | PersistedResource<Derivative>[]
    | null;
}

export type Metadata = KitsuResource &
  MetadataAttributes &
  MetadataRelationships;

// Does not contain the license field, which is client-side only.
export interface MetadataResponseAttributes {
  type: "metadata";
  bucket: string;
  fileIdentifier?: string;
  fileExtension?: string;

  /** Refers to the License/LicenseDTO's 'url' field. */
  xmpRightsWebStatement?: string;
  xmpRightsUsageTerms?: string;
  xmpRightsOwner?: string;

  // optional fields
  group?: string;
  dcRights?: string;
  acSubtype?: string;
  dcType?: DcType;
  acCaption?: string;
  dcFormat?: string;
  createdOn?: string;
  acDigitizationDate?: string | null;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;
  notPubliclyReleasableReason?: string;
  publiclyReleasable?: boolean;
  orientation?: number;

  acHashFunction?: string;
  acHashValue?: string;

  resourceExternalURL?: string;

  // Used for permission information included on the request.
  meta?: DinaJsonMetaInfo;
}
// This interface is used to represent how relationships are structured in the response from the API.
export interface MetadataResponseRelationships {
  derivatives?: {
    data?: PersistedResource<Derivative & { objectUpload: ObjectUpload }>[];
  };
  acMetadataCreator?: {
    data?: PersistedResource<KitsuResource | Person>;
  };
  dcCreator?: {
    data?: PersistedResource<KitsuResource | Person>;
  };
  managedAttributes?: {
    data?: Record<string, string | null | undefined>;
  };
}

export type MetadataResponse = KitsuResource &
  MetadataResponseAttributes &
  MetadataResponseRelationships;

/**
 * Parses a `PersistedResource<MetadataResponse>` object and transforms it into a `PersistedResource<Metadata>`.
 *
 * This function omits specific properties from the input metadata and restructures the relationships
 * (`derivatives`, `acMetadataCreator`, `dcCreator`, `managedAttributes`) to use their `.data` subfields as their values.
 *
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MetadataResponse>`.
 * @returns The parsed metadata resource, of type `PersistedResource<Metadata>`.
 */
export function metadataParser(
  data: PersistedResource<MetadataResponse>
): PersistedResource<Metadata> {
  const parsedMetadata = baseRelationshipParser(
    ["derivatives", "acMetadataCreator", "dcCreator", "managedAttributes"],
    data
  ) as PersistedResource<Metadata>;

  return parsedMetadata;
}
