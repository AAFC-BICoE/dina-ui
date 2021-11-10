import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { PcrBatch } from "../../../types/seqdb-api";
import { PcrBatchFormFields, usePcrBatchQuery } from "./edit";

export default function PcrBatchDetailsPage() {
  return (
    <ViewPageLayout<PcrBatch>
      form={props => (
        <DinaForm<PcrBatch> {...props}>
          <PcrBatchFormFields />
        </DinaForm>
      )}
      query={id => ({ path: `seqdb-api/pcr-batch/${id}` })}
      customQueryHook={id => usePcrBatchQuery(id)}
      entityLink="/seqdb/pcr-batch"
      type="pcr-batch"
      apiBaseUrl="/seqdb-api"
    />
  );
}
