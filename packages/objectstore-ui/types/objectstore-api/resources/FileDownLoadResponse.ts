import * as Blob from "blob-polyfill";

export interface FileDownLoadResponseAttributes {
  body: Blob;
  headers: Map<string, string>;
  status: string;
}
