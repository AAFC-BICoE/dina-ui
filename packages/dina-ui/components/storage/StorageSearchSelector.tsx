import { useLocalStorage } from "@rehooks/local-storage";
import {
  ResourceSelect,
  ResourceSelectField,
  useAccount
} from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { Group } from "../../types/user-api";

export interface StorageSearchSelectorProps {
  fieldName: string;
  excludeOptionId?: string;
}

/** Temporary  */
export function StorageSearchSelector({
  fieldName,
  excludeOptionId = "00000000-0000-0000-0000-000000000000"
}: StorageSearchSelectorProps) {
  const { username } = useAccount();

  const [groupFilter, setGroupFilter] = useLocalStorage<Group | null>(
    "storage-search-group-filter",
    null
  );
  const [createdByMeFilter, setCreatedByMeFilter] = useLocalStorage(
    "storage-search-created-by-me-filter",
    false
  );

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-5 mb-3">
        <label style={{ width: "20rem" }}>
          <strong>
            <DinaMessage id="filterByGroup" />
          </strong>
          <ResourceSelect<Group>
            model="user-api/group"
            optionLabel={group => group.name}
            onChange={newVal => setGroupFilter(newVal as Group)}
            value={groupFilter as Group}
            filter={input => ({ name: input })}
          />
        </label>
        <label className="d-flex align-items-center gap-2">
          <input
            type="checkbox"
            onChange={e => setCreatedByMeFilter(e.target.checked)}
            checked={createdByMeFilter}
            style={{
              height: "20px",
              width: "20px"
            }}
          />
          <strong>
            <DinaMessage id="storagesCreatedByMe" />
          </strong>
        </label>
      </div>
      <div className="row">
        {/* TODO change this dropdown menu to a more detailed table selector. */}
        <label className="col-sm-6">
          <ResourceSelectField<StorageUnit>
            // Re-render on filter change:
            key={`${groupFilter?.name}_${createdByMeFilter}`}
            hideLabel={true}
            name={fieldName}
            filter={input => ({
              rsql: `name=='*${input}*' and uuid!=${excludeOptionId}`,
              ...(groupFilter?.name && { group: { EQ: groupFilter.name } }),
              ...(createdByMeFilter && { createdBy: { EQ: username } })
            })}
            sort="-createdOn"
            model="collection-api/storage-unit"
            optionLabel={unit => unit.name}
            readOnlyLink="/collection/storage-unit/view?id="
          />
        </label>
      </div>
    </div>
  );
}
