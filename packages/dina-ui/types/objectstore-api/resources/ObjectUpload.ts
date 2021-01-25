import { KitsuResource } from "kitsu";

export type DcType =
  | "Image"
  | "Moving Image"
  | "Sound"
  | "Text"
  | "Dataset"
  | "Undetermined";

export interface ObjectUploadAttributes {
  dcType?: DcType;
  fileIdentifier: string;
  metaFileEntryVersion: string;
  originalFilename: string;
  sha1Hex: string;
  receivedMediaType: string;
  detectedMediaType: string;
  detectedFileExtension: string;
  evaluatedMediaType: string;
  evaluatedFileExtension: string;
  sizeInBytes: number;
  exif: Map<string, string>;
  dateTimeDigitized?: string;
}

export type ObjectUpload = KitsuResource & ObjectUploadAttributes;
