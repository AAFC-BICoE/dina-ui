export interface IFileWithMeta {
  file: File;
  meta: IMeta;
  cancel: () => void;
  restart: () => void;
  remove: () => void;
  xhr?: XMLHttpRequest;
}

export interface IMeta {
  type: string;
  name: string;
  size: number;
  lastModifiedDate: string;
}
