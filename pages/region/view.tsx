import { Formik } from "formik";
import Link from "next/link";
import { withRouter, WithRouterProps } from "next/router";
import { FieldView, Head, LoadingSpinner, Nav, Query } from "../../components";
import { Region } from "../../types/seqdb-api/resources/Region";

export function RegionDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Gene Region" />
      <Nav />
      <Query<Region> query={{ path: `region/${id}` }}>
        {({ loading, response }) => (
          <div className="container-fluid">
            <Link href="/region/list">
              <a>Gene Region list</a>
            </Link>
            <h1>Gene Region Details</h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<Region> initialValues={response.data} onSubmit={null}>
                <div>
                  <Link href={`/region/edit?id=${id}`}>
                    <a>Edit</a>
                  </Link>
                  <div className="row">
                    <FieldView className="col-md-2" name="name" />
                    <FieldView className="col-md-2" name="description" />
                    <FieldView className="col-md-2" name="symbol" />
                  </div>
                </div>
              </Formik>
            )}
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(RegionDetailsPage);
