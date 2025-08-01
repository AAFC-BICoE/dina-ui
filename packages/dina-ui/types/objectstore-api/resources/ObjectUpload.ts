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

  // Not stored in the attributes but moved here for reading purposes.
  meta?: DinaJsonMetaInfo;
}

export type ObjectUpload = KitsuResource & ObjectUploadAttributes;
