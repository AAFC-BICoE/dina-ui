import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { Region } from "../../../types/seqdb-api/resources/Region";
import { RegionFormFields } from "./edit";

export default function RegionDetailsPage() {
  return (
    <ViewPageLayout<Region>
      form={(props) => (
        <DinaForm {...props}>
          <RegionFormFields />
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/region/${id}` })}
      entityLink="/seqdb/region"
      type="region"
      apiBaseUrl="/seqdb-api"
    />
  );
}
