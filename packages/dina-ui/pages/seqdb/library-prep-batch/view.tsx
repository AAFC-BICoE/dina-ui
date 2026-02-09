import { ViewPageLayout } from "../../../components";
import { LibraryPrepBatch } from "../../../types/seqdb-api";
import {
  useLibraryPrepBatchQuery,
  LoadExternalDataForLibraryPrepBatchForm
} from "./edit";

export default function PcrBatchDetailsPage() {
  return (
    <ViewPageLayout<LibraryPrepBatch>
      form={(props) => (
        <LoadExternalDataForLibraryPrepBatchForm dinaFormProps={props} />
      )}
      customQueryHook={useLibraryPrepBatchQuery}
      entityLink="/seqdb/library-prep-batch"
      type="library-prep-batch"
      apiBaseUrl="/seqdb-api"
    />
  );
}
