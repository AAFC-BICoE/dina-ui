import { KitsuResource } from "kitsu";
import { Agent } from "./Agent";
import { ManagedAttributeMap } from "./ManagedAttributeMap";

export interface MetadataAttributes {
  type: "metadata";
  bucket: string;
  uuid: string;
  fileIdentifier: string;
  fileExtension: string;
  dcType: "Image" | "Moving Image" | "Sound" | "Text";
  // optional fields
  dcFormat?: string;
  acDigitizationDate?: string;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;

  acHashFunction?: string;
  acHashValue?: string;
}

export interface MetadataRelationships {
  acMetadataCreator?: Agent;
  managedAttributeMap?: ManagedAttributeMap;
}

export type Metadata = KitsuResource &
  MetadataAttributes &
  MetadataRelationships;
