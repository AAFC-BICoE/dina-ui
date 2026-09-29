import { LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import { ReactNode } from "react";
import { Promisable } from "type-fest";
import { MaterialSampleBulkEditor, useMaterialSampleQueries } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSample } from "../../types/collection-api";

export interface ExistingMaterialSampleBulkEditorProps {
  ids: string[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  onPreviousClick?: () => void;

  /**
   * Customize where the button bar and the rest of the editor's content are placed on the page.
   * Defaults to rendering the button bar directly above the rest of the content.
   */
  renderLayout?: (buttonBar: ReactNode, content: ReactNode) => ReactNode;
}

export function ExistingMaterialSampleBulkEditor({
  ids,
  onSaved,
  onPreviousClick,
  renderLayout
}: ExistingMaterialSampleBulkEditorProps) {
  const sampleQueries = useMaterialSampleQueries(ids);

  const loadedCount = sampleQueries.filter((q) => !q.loading).length;
  const total = ids.length;

  /** Whether any query is loading. */
  const isLoading = sampleQueries.some((q) => q.loading);

  const errors = _.compact(sampleQueries.map((query) => query.error));

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center gap-2 mt-4">
        <LoadingSpinner loading={true} />
        <div className="text-muted">
          <DinaMessage
            id="bulkEditLoadingProgress"
            values={{ loaded: loadedCount, total }}
          />
        </div>
      </div>
    );
  }

  if (errors.length) {
    return (
      <div className="alert alert-danger">
        {errors.map((error, index) => (
          <div key={index}>{String(error)}</div>
        ))}
      </div>
    );
  }

  const samples = _.compact(sampleQueries.map((query) => query.response?.data));

  if (samples.length) {
    return (
      <MaterialSampleBulkEditor
        samples={samples}
        onSaved={onSaved}
        onPreviousClick={onPreviousClick}
        renderLayout={renderLayout}
      />
    );
  }

  return null;
}
