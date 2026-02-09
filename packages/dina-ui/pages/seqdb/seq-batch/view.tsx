import { ViewPageLayout } from "../../../components";
import { SeqBatch } from "../../../types/seqdb-api";
import { useSeqBatchQuery, LoadExternalDataForSeqBatchForm } from "./edit";

export default function SeqBatchDetailsPage() {
  return (
    <ViewPageLayout<SeqBatch>
      form={(props) => (
        <LoadExternalDataForSeqBatchForm dinaFormProps={{ ...props }} />
      )}
      customQueryHook={useSeqBatchQuery}
      entityLink="/seqdb/seq-batch"
      type="seq-batch"
      apiBaseUrl="/seqdb-api"
    />
  );
}
