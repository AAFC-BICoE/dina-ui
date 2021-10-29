import { DinaForm, FieldView } from "common-ui";
import { GroupFieldView, ViewPageLayout } from "../../../components";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";

export default function ProductDetailsPage() {
  return (
    <ViewPageLayout<Product>
      form={props => (
        <DinaForm<Product> {...props}>
          <div>
            <div className="row">
              <GroupFieldView className="col-md-2" name="group" />
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
        </DinaForm>
      )}
      query={id => ({ path: `seqdb-api/product/${id}` })}
      entityLink="/seqdb/product"
      type="product"
      apiBaseUrl="/seqdb-api"
      mainClass="container-fluid"
    />
  );
}
