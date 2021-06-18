import { KitsuResource } from "kitsu";
import { DinaJsonMetaInfo } from "../../DinaJsonMetaInfo";

export type DcType =
  | "Image"
  | "Moving Image"
  | "Sound"
  | "Text"
  | "Dataset"
  | "Undetermined";

export interface ObjectUploadAttributes {
  bucket?: string;
  createdBy?: string;
  createdOn?: string;
  dcType?: DcType;
  orientation?: number;
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
  meta?: DinaJsonMetaInfo;
}

export type ObjectUpload = KitsuResource & ObjectUploadAttributes;
