import { StorageUnit, StorageUnitType } from "../../../types/collection-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const STORAGE_UNIT_REVISION_ROW_CONFIG: RevisionRowConfig<StorageUnit> =
  {
    customValueCells: {
      storageUnitType: ({ original: { value } }) => (
        <ReferenceLink<StorageUnitType>
          type="storage-unit-type"
          baseApiPath="collection-api"
          reference={value}
          name={({ name }) => name}
          href="/collection/storage-unit-type/view?id="
        />
      ),
      parentStorageUnit: ({ original: { value } }) => (
        <ReferenceLink<StorageUnitType>
          type="storage-unit"
          baseApiPath="collection-api"
          reference={value}
          name={({ name }) => name}
          href="/collection/storage-unit/view?id="
        />
      )
    }
  };
