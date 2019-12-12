import { KitsuResource } from "kitsu";
import { Agent } from "./Agent";
import { MetaManagedAttribute } from "./MetaManagedAttribute";

export interface MetadataAttributes {
  type: "metadata";
  bucket: string;
  uuid: string;
  fileIdentifier: string;
  fileExtension: string;
  dcType: DcType;
  // optional fields
  dcFormat?: string;
  acDigitizationDate?: string;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;

  acHashFunction?: string;
  acHashValue?: string;
}
export enum DcType {
  IMAGE = "Image",
  MOVING_IMAGE = "Moving Image",
  SOUND = "Sound",
  TEXT = "Text"
}

export interface MetadataRelationships {
  acMetadataCreator?: Agent;
  managedAttribute?: MetaManagedAttribute;
}

export type Metadata = KitsuResource & MetadataAttributes;
