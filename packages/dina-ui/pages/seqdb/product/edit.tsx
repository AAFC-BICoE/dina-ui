import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  LabelView,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";

interface ProductFormProps {
  product?: Product;
  router: NextRouter;
}

export function ProductEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editProductTitle" : "addProductTitle";

  const query = useQuery<Product>({
    path: `seqdb-api/product/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editProductTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ProductForm product={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addProductTitle" />
            </h1>
            <ProductForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function ProductForm({ product, router }: ProductFormProps) {
  const { formatMessage } = useSeqdbIntl();

  const { id } = router.query;
  const initialValues = product || {};

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
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
    await router.push(`/seqdb/product/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton entityId={id as string} entityLink="/seqdb/product" />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <ProductFormFields />
    </DinaForm>
  );
}

export function ProductFormFields() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <div className="row">
        <GroupSelectField
          className="col-md-2"
          name="group"
          enableStoredDefaultGroup={true}
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
  );
}

export default withRouter(ProductEditPage);
