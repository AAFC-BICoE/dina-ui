import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { PcrBatch } from "../../../types/seqdb-api";
import { usePcrBatchQuery, LoadExternalDataForPcrBatchForm } from "./edit";

export default function PcrBatchDetailsPage() {
  return (
    <ViewPageLayout<PcrBatch>
      form={(props) => (
        <LoadExternalDataForPcrBatchForm dinaFormProps={{ ...props }} />
      )}
      customQueryHook={(id) => usePcrBatchQuery(id)}
      entityLink="/seqdb/pcr-batch"
      type="pcr-batch"
      apiBaseUrl="/seqdb-api"
    />
  );
}
