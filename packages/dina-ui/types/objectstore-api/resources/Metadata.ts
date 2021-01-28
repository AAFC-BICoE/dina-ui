import { KitsuResource } from "kitsu";
import { ManagedAttributeMap } from "./ManagedAttributeMap";
import { DcType } from "./ObjectUpload";
import { Person } from "./Person";

export interface MetadataAttributes {
  type: "metadata";
  bucket: string;
  fileIdentifier: string;
  fileExtension?: string;

  /** Refers to the License/LicenseDTO's 'url' field. */
  xmpRightsWebStatement?: string;
  xmpRightsUsageTerms?: string;
  xmpRightsOwner?: string;

  // optional fields
  group?: string;
  dcRights?: string;
  acSubType?: string;
  dcType?: DcType;
  acCaption?: string;
  dcFormat?: string;
  createdDate?: string;
  deletedDate?: string;
  acDigitizationDate?: string | null;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;
  notPubliclyReleasableReason?: string;
  publiclyReleasable?: boolean;

  acHashFunction?: string;
  acHashValue?: string;
}

export interface MetadataRelationships {
  acMetadataCreator?: Person | KitsuResource | null;
  dcCreator?: Person | KitsuResource | null;
  managedAttributeMap?: ManagedAttributeMap | null;
  acDerivedFrom?: Metadata | null;
}

export type Metadata = KitsuResource &
  MetadataAttributes &
  MetadataRelationships;
