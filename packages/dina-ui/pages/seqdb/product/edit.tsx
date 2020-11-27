import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  ErrorViewer,
  LabelView,
  LoadingSpinner,
  Query,
  safeSubmit,
  SelectField,
  SubmitButton,
  TextField,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";

interface ProductFormProps {
  product?: Product;
  router: NextRouter;
}

export function ProductEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("editProductTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <SeqdbMessage id="editProductTitle" />
            </h1>
            <Query<Product> query={{ path: `seqdb-api/product/${id}` }}>
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
            <h1>
              <SeqdbMessage id="addProductTitle" />
            </h1>
            <ProductForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProductForm({ product, router }: ProductFormProps) {
  const { save } = useContext(ApiClientContext);
  const { formatMessage } = useSeqdbIntl();
  const groupSelectOptions = useGroupSelectOptions();

  const { id } = router.query;
  const initialValues = product || { group: groupSelectOptions[0].value };

  const onSubmit = safeSubmit(async submittedValues => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "product"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/product/view?id=${newId}`);
  });

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton entityId={id as string} entityLink="/seqdb/product" />
        </ButtonBar>
        <div>
          <div className="row">
            <SelectField
              className="col-md-2"
              disabled={true}
              name="group"
              options={groupSelectOptions}
            />
          </div>
          <div className="row">
            <LabelView
              className="col-md-2"
              name="labelname"
              label={formatMessage("productUpcFieldHelpText")}
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
