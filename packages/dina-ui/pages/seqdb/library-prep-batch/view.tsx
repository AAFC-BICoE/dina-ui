import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { LibraryPrepBatch2 } from "../../../types/seqdb-api";
import {
  useLibraryPrepBatchQuery,
  LoadExternalDataForLibraryPrepBatchForm
} from "./edit";

export default function PcrBatchDetailsPage() {
  return (
    <ViewPageLayout<LibraryPrepBatch2>
      form={(props) => (
        <LoadExternalDataForLibraryPrepBatchForm dinaFormProps={props} />
      )}
      customQueryHook={(id) => useLibraryPrepBatchQuery(id)}
      entityLink="/seqdb/library-prep-batch"
      type="library-prep-batch"
      apiBaseUrl="/seqdb-api"
    />
  );
}
