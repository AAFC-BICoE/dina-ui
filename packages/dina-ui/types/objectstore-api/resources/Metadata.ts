import { KitsuResource } from "kitsu";
import { ManagedAttributeMap } from "./ManagedAttributeMap";
import { Person } from "./Person";

export interface MetadataAttributes {
  type: "metadata";
  bucket: string;
  fileIdentifier: string;
  fileExtension: string;
  dcType:
    | "Image"
    | "Moving Image"
    | "Sound"
    | "Text"
    | "Dataset"
    | "Undetermined";
  xmpRightsWebStatement?: string;

  // optional fields
  acRights?: string;
  acSubType?: string;
  acCaption?: string;
  dcFormat?: string;
  createdDate?: string;
  deletedDate?: string;
  acDigitizationDate?: string;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;
  notPubliclyReleasableReason?: string;
  publiclyReleasable?: boolean;

  acHashFunction?: string;
  acHashValue?: string;
}

export interface MetadataRelationships {
  acMetadataCreator?: Person | string | null;
  dcCreator?: Person | string | null;
  managedAttributeMap?: ManagedAttributeMap | null;
  acDerivedFrom?: Metadata | null;
}

export type Metadata = KitsuResource &
  MetadataAttributes &
  MetadataRelationships;
