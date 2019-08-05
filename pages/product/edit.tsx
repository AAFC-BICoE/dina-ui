import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
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

interface ProductFormProps {
  product?: Product;
  router: NextRouter;
}

export function ProductEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  return (
    <div>
      <Head title="Edit Product" />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>Edit Product</h1>
            <Query<Product> query={{ include: "group", path: `product/${id}` }}>
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ProductForm product={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>Add Product</h1>
            <ProductForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProductForm({ product, router }: ProductFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = product || {};

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const response = await save([
        {
          resource: submittedValues,
          type: "product"
        }
      ]);

      const newId = response[0].id;
      router.push(`/product/view?id=${newId}`);
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton entityId={id as string} entityLink="product" />
        </ButtonBar>
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
        </div>
      </Form>
    </Formik>
  );
}
export default withRouter(ProductEditPage);
