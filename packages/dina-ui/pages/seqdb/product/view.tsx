import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { Product } from "../../../types/seqdb-api/resources/Product";
import { ProductFormFields } from "./edit";

export default function ProductDetailsPage() {
  return (
    <ViewPageLayout<Product>
      form={(props) => (
        <DinaForm<Product> {...props}>
          <ProductFormFields />
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/product/${id}` })}
      entityLink="/seqdb/product"
      type="product"
      apiBaseUrl="/seqdb-api"
      mainClass="container-fluid"
    />
  );
}
