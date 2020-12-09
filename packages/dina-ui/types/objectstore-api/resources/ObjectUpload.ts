import { KitsuResource } from "kitsu";

export interface ObjectUploadAttributes {
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
