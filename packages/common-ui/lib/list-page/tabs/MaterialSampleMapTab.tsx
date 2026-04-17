import { QueryPageTabProps } from "../QueryPage";
import { KitsuResource } from "kitsu";
import MaterialSampleMap from "../../../../dina-ui/components/maps/MaterialSampleMap";

export function MaterialSampleMapTab<
  TData extends KitsuResource
>({}: QueryPageTabProps<TData>) {
  return <MaterialSampleMap />;
}
