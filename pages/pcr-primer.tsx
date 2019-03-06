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
                    <FieldView name="type" />
                  </div>
                  <div className="row">
                    <FieldView label="Target Gene Region" name="region.name" />
                    <FieldView name="name" />
                    <FieldView name="lotNumber" />
                    <FieldView name="targetSpecies" />
                    <FieldView name="purification" />
                  </div>
                  <div className="row">
                    <FieldView name="direction" />
                    <FieldView name="tmCalculated" />
                    <FieldView name="dateOrdered" />
                    <FieldView name="dateDestroyed" />
                  </div>
                  <div className="row">
                    <FieldView
                      colWidth={6}
                      label="Primer Sequence (5' - 3')"
                      name="seq"
                    />
                  </div>
                  <div className="row">
                    <FieldView name="application" />
                    <FieldView name="reference" />
                    <FieldView name="supplier" />
                    <FieldView name="designedBy" />
                    <FieldView
                      label="Stock Concentration(uM)"
                      name="stockConcentration"
                    />
                  </div>
                  <div className="row">
                    <FieldView colWidth={6} name="notes" />
                  </div>
                  <div className="row">
                    <FieldView label="Literature Reference" name="reference" />
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
