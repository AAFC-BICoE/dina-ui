import { LoadingSpinner } from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { compact } from "lodash";
import { Promisable } from "type-fest";
import { License, Metadata } from "../../types/objectstore-api";
import { useMetadataEditQuery } from "../object-store/metadata/useMetadata";
import { MetadataBulkEditor } from "./MetadataBulkEditor";

export interface ExistingMetadataBulkEditorProps {
  ids: string[];
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  onPreviousClick?: () => void;
}

export function ExistingMetadataBulkEditor({
  ids,
  onSaved,
  onPreviousClick
}: ExistingMetadataBulkEditorProps) {
  const metadataQueries = ids.map((id) => useMetadataEditQuery(id));

  /** Whether any query is loading. */
  const isLoading = metadataQueries.reduce(
    (prev, current) => prev || current.loading,
    false
  );

  const errors = compact(metadataQueries.map((query) => query.error));

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

  const metadatas = compact(
    metadataQueries.map(
      (query) => query.response?.data as InputResource<Metadata>
    )
  );

  if (metadatas.length) {
    return (
      <MetadataBulkEditor
        metadatas={metadatas}
        onSaved={onSaved}
        onPreviousClick={onPreviousClick}
      />
    );
  }

  return null;
}
