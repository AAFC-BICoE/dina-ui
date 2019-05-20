import { Formik } from "formik";
import { withRouter, WithRouterProps } from "next/router";
import React from "react";
import { FieldView, Head, LoadingSpinner, Nav, Query } from "../../components";
import { Link, Trans, withNamespaces } from "../../i18n";
import { Product } from "../../types/seqdb-api/resources/Product";

export class ProductDetailsPage extends React.Component<WithRouterProps> {
  public static async getInitialProps() {
    return {
      namespacesRequired: ["product"]
    };
  }
  public id = this.props.router.query.id;
  public render() {
    return (
      <div>
        <Head title="Product " />
        <Nav />
        <Query<Product>
          query={{ include: "group", path: `product/${this.id}` }}
        >
          {({ loading, response }) => (
            <div className="container-fluid">
              <Link href="/product/list">
                <a>
                  <Trans i18nKey="Product Inventory" />
                </a>
              </Link>
              <h1>
                <Trans i18nKey="Product Details" />
              </h1>
              <LoadingSpinner loading={loading} />
              {response && (
                <Formik<Product> initialValues={response.data} onSubmit={null}>
                  <div>
                    <Link href={`/product/edit?id=${this.id}`}>
                      <a>
                        <Trans i18nKey="Edit" />
                      </a>
                    </Link>
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
}

export default withRouter(withNamespaces("product")(ProductDetailsPage));
