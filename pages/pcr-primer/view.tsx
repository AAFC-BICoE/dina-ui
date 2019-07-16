import { Formik } from "formik";
import Link from "next/link";
import { withRouter, WithRouterProps } from "next/router";
import {
  ButtonBar,
  FieldView,
  Head,
  LoadingSpinner,
  Nav,
  Query
} from "../../components";
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";

export function PcrPrimerDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="PCR Primer" />
      <Nav />
      <ButtonBar>
        <Link href={`/pcr-primer/edit?id=${id}`}>
          <button className="btn btn-primary">Edit</button>
        </Link>
        <Link href="/pcr-primer/list">
          <button className="btn btn-secondary">Back to List</button>
        </Link>
      </ButtonBar>
      <Query<PcrPrimer>
        query={{ include: "group,region", path: `pcrPrimer/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>PCR Primer Details</h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<PcrPrimer> initialValues={response.data} onSubmit={null}>
                <div>
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
                    <FieldView className="col-md-6" name="note" />
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

export default withRouter(PcrPrimerDetailsPage);
