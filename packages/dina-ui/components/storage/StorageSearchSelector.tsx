import { ResourceSelectField } from "../../../common-ui/lib";
import { StorageUnit } from "../../types/collection-api";

export interface StorageSearchSelectorProps {
  fieldName: string;
  excludeOptionId?: string;
}

/** Temporary  */
export function StorageSearchSelector({
  fieldName,
  excludeOptionId = "00000000-0000-0000-0000-000000000000"
}: StorageSearchSelectorProps) {
  return (
    <ResourceSelectField<StorageUnit>
      hideLabel={true}
      name={fieldName}
      filter={input => ({
        rsql: `name=='*${input}*' and uuid!=${excludeOptionId}`
      })}
      model="collection-api/storage-unit"
      className="col-sm-6"
      optionLabel={unit => unit.name}
      readOnlyLink="/collection/storage-unit/view?id="
    />
  );
}
