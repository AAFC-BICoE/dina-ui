import { filterBy, ResourceSelectField } from "../../../common-ui/lib";
import { StorageUnit } from "../../types/collection-api";

export interface StorageSearchSelectorProps {
  fieldName: string;
}

/** Temporary  */
export function StorageSearchSelector({
  fieldName
}: StorageSearchSelectorProps) {
  return (
    <ResourceSelectField<StorageUnit>
      hideLabel={true}
      name={fieldName}
      filter={filterBy(["name"])}
      model="collection-api/storage-unit"
      className="col-sm-6"
      optionLabel={unit => unit.name}
      readOnlyLink="/collection/storage-unit/view?id="
    />
  );
}
