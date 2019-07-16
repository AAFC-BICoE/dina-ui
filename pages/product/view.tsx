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
import { Product } from "../../types/seqdb-api/resources/Product";

export function ProductDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  return (
    <div>
      <Head title="Product " />
      <Nav />
      <ButtonBar>
        <Link href={`/product/edit?id=${id}`}>
          <button className="btn btn-primary">Edit</button>
        </Link>
        <Link href="/product/list">
          <button className="btn btn-secondary">Back to List</button>
        </Link>
      </ButtonBar>
      <Query<Product> query={{ include: "group", path: `product/${id}` }}>
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>Product Inventory</h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<Product> initialValues={response.data} onSubmit={null}>
                <div>
                  <div className="row">
                    <FieldView
                      className="col-md-2"
                      name="group.groupName"
                      label="Group Name"
                    />
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
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(ProductDetailsPage);
