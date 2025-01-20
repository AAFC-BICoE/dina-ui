import { LoadingSpinner } from "common-ui";
import { InputResource } from "kitsu";
import { compact } from "lodash";
import { useStorageUnit } from "packages/dina-ui/pages/collection/storage-unit/edit";
import { StorageUnit } from "packages/dina-ui/types/collection-api";
import { StorageUnitBulkEditor } from "./StorageUnitBulkEditor";

export interface ExistingStorageUnitBulkEditorProps {
  ids: string[];
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  onPreviousClick?: () => void;
}

export function ExistingStorageUnitBulkEditor({
  ids,
  onSaved,
  onPreviousClick
}: ExistingStorageUnitBulkEditorProps) {
  const storageUnitQueries = ids.map((id) => useStorageUnit(id));

  /** Whether any query is loading. */
  const isLoading = storageUnitQueries.reduce(
    (prev, current) => prev || current.loading,
    false
  );

  const errors = compact(storageUnitQueries.map((query) => query.error));

  if (isLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (errors.length) {
    return (
      <div className="alert alert-danger">
        {errors.map((error, index) => (
          <div key={index}>
            {error?.errors?.map((e) => e.detail).join("\n") ?? String(error)}
          </div>
        ))}
      </div>
    );
  }

  const storageUnits = compact(
    storageUnitQueries.map(
      (query) => query.response?.data as InputResource<StorageUnit>
    )
  );

  if (storageUnits.length) {
    return (
      <StorageUnitBulkEditor
        storageUnits={storageUnits}
        onSaved={onSaved}
        onPreviousClick={onPreviousClick}
      />
    );
  }

  return null;
}
