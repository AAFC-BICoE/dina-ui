import { Form, Formik, FormikActions } from "formik";
import { Router } from "../../i18n";
import { withRouter, WithRouterProps } from "next/router"
import { useContext } from "react";
import {
  ApiClientContext,
  ErrorViewer,
  Head,
  LoadingSpinner,
  Nav,
  Query,
  ResourceSelectField,
  SubmitButton,
  TextField
} from "../../components";
import { LabelView } from "../../components/LabelView";
import { Group } from "../../types/seqdb-api/resources/Group";
import { Product } from "../../types/seqdb-api/resources/Product";
import { filterBy } from "../../util/rsql";
import { serialize } from "../../util/serialize";
import React from "react";
import { withNamespaces, Trans } from "../../i18n";

interface ProductFormProps {
  product?: Product
}
export class ProductEditPage extends React.Component<WithRouterProps> {

  public id = this.props.router.query.id;
  static async getInitialProps() {
    return {
      namespacesRequired: ['product']
    }
  }
  render() {
    return (
      <div>
        <Head title="Edit Product" />
        <Nav />
        <div className="container-fluid">
          {this.id ? (
            <div>
              <h1><Trans i18nKey="Edit Product" /></h1>
              <Query<Product> query={{ include: "group", path: `product/${this.id}` }}>
                {({ loading, response }) => (
                  <div>
                    <LoadingSpinner loading={loading} />
                    {response && (
                      <ProductForm product={response.data} />
                    )}
                  </div>
                )}
              </Query>
            </div>
          ) : (
              <div>
                <h1>Add Product</h1>
                <ProductForm />
              </div>
            )}
        </div>
      </div>
    );
  }
}

function ProductForm({ product }: ProductFormProps) {
  const { doOperations } = useContext(ApiClientContext);

  const initialValues = product || {};

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const serialized = await serialize({
        resource: submittedValues,
        type: "product"
      });

      const op = submittedValues.id ? "PATCH" : "POST";

      if (op === "POST") {
        serialized.id = -100;
      }

      const response = await doOperations([
        {
          op,
          path: op === "PATCH" ? `product/${product.id}` : "product",
          value: serialized
        }
      ]);

      const newId = response[0].data.id;
      Router.push(`/product/view?id=${newId}`);
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <div>
          <div className="row">
            <ResourceSelectField<Group>
              className="col-md-2"
              name="group"
              filter={filterBy(["groupName"])}
              model="group"
              optionLabel={group => group.groupName}
            />
          </div>
          <div className="row">
            <LabelView
              className="col-md-2"
              name="labelname"
              label="Note: Universal Product Code can be read from barcode scanner in keyboard mode"
            />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="name" />
            <TextField
              className="col-md-2"
              name="upc"
              label="Universal Product Code (UPC)"
            />
            <TextField className="col-md-2" name="type" />
          </div>
          <div className="row">
            <TextField className="col-md-4" name="description" />
          </div>
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
}
export default withRouter(withNamespaces('product')(ProductEditPage));
