import { LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { compact } from "lodash";
import { Promisable } from "type-fest";
import { MaterialSampleBulkEditor, useMaterialSampleQuery } from "..";
import { MaterialSample } from "../../types/collection-api";

export interface ExistingMaterialSampleBulkEditorProps {
  ids: string[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  onPreviousClick?: () => void;
}

export function ExistingMaterialSampleBulkEditor({
  ids,
  onSaved,
  onPreviousClick
}: ExistingMaterialSampleBulkEditorProps) {
  const sampleQueries = ids.map((id) => useMaterialSampleQuery(id));

  /** Whether any query is loading. */
  const isLoading = sampleQueries.reduce(
    (prev, current) => prev || current.loading,
    false
  );

  const errors = compact(sampleQueries.map((query) => query.error));

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

  const samples = compact(sampleQueries.map((query) => query.response?.data));

  if (samples.length) {
    return (
      <MaterialSampleBulkEditor
        samples={samples}
        onSaved={onSaved}
        onPreviousClick={onPreviousClick}
      />
    );
  }

  return null;
}
