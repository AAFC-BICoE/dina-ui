import { withRouter, WithRouterProps } from "next/router";
import { Query } from "../components/api-client/Query";
import Head from "../components/head";
import Nav from "../components/nav";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";
import Link from "next/link";

export default withRouter(function PcrPrimerDetailsPage({ router }) {
  const { id } = router.query;

  return (
    <div>
      <Head title="PCR Primer" />
      <Nav />
      <Query<PcrPrimer> query={{ path: `pcrPrimer/${id}` }}>
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>PCR Primer Details</h1>
            {loading && (
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            )}
            {response && (
              <div>
                <Link href={`edit-pcr-primer?id=${id}`}>
                  <a>Edit</a>
                </Link>
                <div className="form-group col-md-2">
                  <label>Name:</label>
                  <div className="card">{response.data.name}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Query>
    </div>
  );
});
