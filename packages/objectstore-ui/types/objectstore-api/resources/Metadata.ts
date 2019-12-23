import { KitsuResource } from "kitsu";
import { Agent } from "./Agent";
import { MetaManagedAttribute } from "./MetaManagedAttribute";

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
  managedAttribute?: MetaManagedAttribute;
}

export type Metadata = KitsuResource & MetadataAttributes;
