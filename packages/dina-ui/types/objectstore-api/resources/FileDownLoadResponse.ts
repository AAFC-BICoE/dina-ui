import * as Blob from "blob";

export interface FileDownLoadResponseAttributes {
  body: Blob;
  headers: Map<string, string>;
  status: number;
}
