import { KitsuResource } from "kitsu";
import { DinaJsonMetaInfo } from "../../DinaJsonMetaInfo";

export type DcType =
  | "IMAGE"
  | "MOVING_IMAGE"
  | "SOUND"
  | "TEXT"
  | "DATASET"
  | "UNDETERMINED";

export interface ObjectUploadAttributes {
  bucket?: string;
  createdBy?: string;
  createdOn?: string;
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
  meta?: DinaJsonMetaInfo;
}

export type ObjectUpload = KitsuResource & ObjectUploadAttributes;
