import { QueryPageTabProps } from "../QueryPage";
import { KitsuResource } from "kitsu";
import MaterialSampleMap from "../../../../dina-ui/components/maps/MaterialSampleMap";

export function MaterialSampleMapTab<TData extends KitsuResource>({
  query,
  totalRecords
}: QueryPageTabProps<TData>) {
  const queryParams = query.query;
  return <MaterialSampleMap query={queryParams} totalRecords={totalRecords} />;
}
