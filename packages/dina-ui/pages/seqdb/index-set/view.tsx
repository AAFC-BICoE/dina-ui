import { ViewPageLayout } from "../../../components";
import { IndexSet } from "../../../types/seqdb-api";
import { IndexSetForm } from "./edit";

export default function IndexSetViewPage() {
  return (
    <ViewPageLayout<IndexSet>
      form={(props) => <IndexSetForm dinaFormProps={props} />}
      query={(id) => ({ path: `seqdb-api/index-set/${id}` })}
      entityLink="/seqdb/index-set"
      type="index-set"
      apiBaseUrl="/seqdb-api"
      mainClass="container-fluid"
    />
  );
}
