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
              <Formik<PcrPrimer> initialValues={response.data} onSubmit={null}>
                <div>
                  <Link href={`/pcr-primer-edit?id=${id}`}>
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
                    <FieldView className="col-md-2" name="type" />
                  </div>
                  <div className="row">
                    <FieldView
                      className="col-md-2"
                      label="Target Gene Region"
                      name="region.name"
                    />
                    <FieldView className="col-md-2" name="name" />
                    <FieldView className="col-md-2" name="lotNumber" />
                    <FieldView className="col-md-2" name="targetSpecies" />
                    <FieldView className="col-md-2" name="purification" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="direction" />
                    <FieldView className="col-md-2" name="tmCalculated" />
                    <FieldView className="col-md-2" name="dateOrdered" />
                    <FieldView className="col-md-2" name="dateDestroyed" />
                  </div>
                  <div className="row">
                    <FieldView
                      className="col-md-6"
                      label="Primer Sequence (5' - 3')"
                      name="seq"
                    />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="application" />
                    <FieldView className="col-md-2" name="reference" />
                    <FieldView className="col-md-2" name="supplier" />
                    <FieldView className="col-md-2" name="designedBy" />
                    <FieldView
                      className="col-md-2"
                      label="Stock Concentration(uM)"
                      name="stockConcentration"
                    />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-6" name="notes" />
                  </div>
                  <div className="row">
                    <FieldView
                      className="col-md-2"
                      label="Literature Reference"
                      name="reference"
                    />
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
