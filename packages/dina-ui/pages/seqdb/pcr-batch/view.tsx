import { ViewPageLayoutWithCustomHook } from "../../../components";
import { PcrBatch } from "../../../types/seqdb-api";
import { usePcrBatchQuery, LoadExternalDataForPcrBatchForm } from "./edit";

export default function PcrBatchDetailsPage() {
  return (
    <ViewPageLayoutWithCustomHook<PcrBatch>
      form={(props) => (
        <LoadExternalDataForPcrBatchForm dinaFormProps={{ ...props }} />
      )}
      customQueryHook={usePcrBatchQuery}
      entityLink="/seqdb/pcr-batch"
      type="pcr-batch"
      apiBaseUrl="/seqdb-api"
    />
  );
}
