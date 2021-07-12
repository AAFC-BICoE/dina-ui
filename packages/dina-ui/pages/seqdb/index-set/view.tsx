import {
  BackToListButton,
  ButtonBar,
  DinaForm,
  FieldView,
  LoadingSpinner,
  QueryTable,
  useQuery
} from "common-ui";
import { useRouter } from "next/router";
import { GroupFieldView, Head, Nav } from "../../../components";
import { IndexSet } from "../../../types/seqdb-api";

export default function IndexSetViewPage() {
  const {
    query: { id }
  } = useRouter();

  const { loading, response } = useQuery<IndexSet>({
    path: `seqdb-api/index-set/${id}`
  });

  if (loading) {
    return <LoadingSpinner loading={loading} />;
  }

  if (response) {
    return (
      <>
        <Head title="Index Set" />
        <Nav />
        <ButtonBar>
          <BackToListButton entityLink="/seqdb/index-set" />
        </ButtonBar>
        <DinaForm initialValues={response.data}>
          <main className="container-fluid">
            <h1>Index Set Details</h1>
            <div className="row">
              <GroupFieldView className="col-md-2" name="group" />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="name" />
            </div>
            <div className="row">
              <FieldView className="col-md-6" name="forwardAdapter" />
              <FieldView className="col-md-6" name="reverseAdapter" />
            </div>
            <strong>NGS indexes:</strong>
            <QueryTable
              columns={["name", "lotNumber", "direction"]}
              path={`seqdb-api/index-set/${id}/ngsIndexes`}
            />
          </main>
        </DinaForm>
      </>
    );
  }

  return null;
}
