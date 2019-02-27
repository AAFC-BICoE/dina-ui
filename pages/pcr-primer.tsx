import { Formik } from "formik";
import Link from "next/link";
import { withRouter } from "next/router";
import { Query } from "../components/api-client/Query";
import { FieldView } from "../components/field-view/FieldView";
import Head from "../components/head";
import Nav from "../components/nav";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";

export default withRouter(function PcrPrimerDetailsPage({ router }) {
  const { id } = router.query;

  return (
    <div>
      <Head title="PCR Primer" />
      <Nav />
      <Query<PcrPrimer>
        query={{ include: "group,region", path: `pcrPrimer/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <Link href="pcr-primers">
              <a>PCR Primer list</a>
            </Link>
            <h1>PCR Primer Details</h1>
            {loading && (
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            )}
            {response && (
              <Formik initialValues={response.data} onSubmit={null}>
                <div>
                  <Link href={`edit-pcr-primer?id=${id}`}>
                    <a>Edit</a>
                  </Link>
                  <div className="row">
                    <FieldView name="group.groupName" label="Group Name" />
                  </div>
                  <div className="row">
                    <FieldView name="name" />
                    <FieldView name="type" />
                    <FieldView name="seq" />
                  </div>
                </div>
              </Formik>
            )}
          </div>
        )}
      </Query>
    </div>
  );
});
