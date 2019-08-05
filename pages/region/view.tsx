import { Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import {
  BackToListButton,
  ButtonBar,
  EditButton,
  FieldView,
  Head,
  LoadingSpinner,
  Nav,
  Query
} from "../../components";
import { Region } from "../../types/seqdb-api/resources/Region";

export function RegionDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Gene Region" />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="region" />
        <BackToListButton entityLink="region" />
      </ButtonBar>
      <Query<Region> query={{ path: `region/${id}` }}>
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>Gene Region Details</h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<Region> initialValues={response.data} onSubmit={null}>
                <div>
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
