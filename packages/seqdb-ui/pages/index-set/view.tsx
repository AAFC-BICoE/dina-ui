import { FieldView, LoadingSpinner, QueryTable, useQuery } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { useRouter } from "next/router";
import { BackToListButton, ButtonBar, Head, Nav } from "../../components";
import { IndexSet } from "../../types/seqdb-api";

export default function IndexSetViewPage() {
  const {
    query: { id }
  } = useRouter();

  const { loading, response } = useQuery<IndexSet>({
    path: `seqdb-api/indexSet/${id}`
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
          <BackToListButton entityLink="index-set" />
        </ButtonBar>
        <Formik initialValues={response.data} onSubmit={noop}>
          <div className="container-fluid">
            <h1>Index Set Details</h1>
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
              path={`seqdb-api/indexSet/${id}/ngsIndexes`}
            />
          </div>
        </Formik>
      </>
    );
  }

  return null;
}
