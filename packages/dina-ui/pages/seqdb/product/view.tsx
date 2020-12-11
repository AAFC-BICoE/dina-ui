import {
  BackToListButton,
  ButtonBar,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";

export function ProductDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("productViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="seqdb/product" />
        <BackToListButton entityLink="/seqdb/product" />
      </ButtonBar>
      <Query<Product> query={{ path: `seqdb-api/product/${id}` }}>
        {({ loading, response }) => (
          <main className="container-fluid">
            <h1>
              <SeqdbMessage id="productViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<Product> initialValues={response.data} onSubmit={noop}>
                <div>
                  <div className="row">
                    <FieldView className="col-md-2" name="group" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="name" />
                    <FieldView
                      className="col-md-2"
                      name="upc"
                      label="Universal Product Code (UPC)"
                    />
                    <FieldView className="col-md-2" name="type" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-4" name="description" />
                  </div>
                </div>
              </Formik>
            )}
          </main>
        )}
      </Query>
    </div>
  );
}

export default withRouter(ProductDetailsPage);
