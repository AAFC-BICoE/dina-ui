import { KitsuResource, PersistedResource } from "kitsu";
import { Person } from "../../agent-api/resources/Person";
import { DinaJsonMetaInfo } from "../../DinaJsonMetaInfo";
import { Derivative } from "./Derivative";
import { License } from "./License";
import { DcType } from "./ObjectUpload";

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
  createdDate?: string;
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
  derivatives?: PersistedResource<Derivative>[] | null;
}

export type Metadata = KitsuResource &
  MetadataAttributes &
  MetadataRelationships;
