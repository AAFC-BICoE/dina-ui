import { Formik } from "formik";
import Link from "next/link";
import { withRouter, WithRouterProps } from "next/router";
import { FieldView, Head, LoadingSpinner, Nav, Query } from "../../components";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";

export function PcrProfileDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Thermocycler Profile Details" />
      <Nav />
      <Query<PcrProfile>
        query={{ include: "group,region", path: `thermocyclerprofile/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <Link href="/pcr-profile/list">
              <a>PCR Profile List</a>
            </Link>
            <h1>PCR Profile Details</h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<PcrProfile> initialValues={response.data} onSubmit={null}>
                <div>
                  <Link href={`/pcr-profile/edit?id=${id}`}>
                    <a>Edit</a>
                  </Link>
                  <div className="row">
                    <FieldView
                      className="col-md-2"
                      name="group.groupName"
                      label="Group Name"
                    />
                  </div>
                  <div className="row">
                    <FieldView
                      className="col-md-2"
                      label="Target Gene Region"
                      name="region.name"
                    />
                    <FieldView className="col-md-2" name="name" label="Thermocycler Profile Name" />
                    <FieldView className="col-md-2" name="application" />
                    <FieldView className="col-md-2" name="cycles" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 1" />
                    <FieldView className="col-md-2" name="step 11" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 2" />
                    <FieldView className="col-md-2" name="step 12" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 3" />
                    <FieldView className="col-md-2" name="step 13" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 4" />
                    <FieldView className="col-md-2" name="step 14" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 5" />
                    <FieldView className="col-md-2" name="step 15" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 6" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 7" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 8" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 9" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="step 10" />
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

export default withRouter(PcrProfileDetailsPage);
