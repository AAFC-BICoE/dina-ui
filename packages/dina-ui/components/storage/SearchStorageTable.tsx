import { DinaForm } from "../../../common-ui/lib";

export interface SearchStorageTableFilterRow {
  type: string;
  name: string;
}

export interface SearchStorageTableFormValues {
  filterRows: SearchStorageTableFilterRow[];
}

export function SearchStorageTable() {
  return (
    <DinaForm<SearchStorageTableFormValues>
      initialValues={{
        filterRows: []
      }}
    >
      TODO
    </DinaForm>
  );
}
