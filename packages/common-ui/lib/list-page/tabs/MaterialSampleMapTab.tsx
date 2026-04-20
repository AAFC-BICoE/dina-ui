import { QueryPageTabProps } from "../QueryPage";
import { KitsuResource } from "kitsu";
import MaterialSampleMap from "../../../../dina-ui/components/maps/MaterialSampleMap";

export function MaterialSampleMapTab<TData extends KitsuResource>({
  query,
  totalRecords
}: QueryPageTabProps<TData>) {
  return <MaterialSampleMap query={query} totalRecords={totalRecords} />;
}
