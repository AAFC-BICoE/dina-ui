import { LoadingSpinner } from "common-ui";
import { InputResource } from "kitsu";
import _ from "lodash";
import { Metadata } from "../../types/objectstore-api";
import { useMetadataEditQuery } from "../object-store/metadata/useMetadata";
import {
  MetadataBulkEditor,
  MetadataBulkEditorHandle
} from "./MetadataBulkEditor";
import { forwardRef } from "react";

export interface ExistingMetadataBulkEditorProps {
  ids: string[];
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  onPreviousClick?: () => void;
  insideModal?: boolean;
}

export const ExistingMetadataBulkEditor = forwardRef<
  MetadataBulkEditorHandle,
  ExistingMetadataBulkEditorProps
>(({ ids, onSaved, onPreviousClick, insideModal }, ref) => {
  const metadataQueries = ids.map((id) => useMetadataEditQuery(id));

  /** Whether any query is loading. */
  const isLoading = metadataQueries.reduce(
    (prev, current) => prev || current.loading,
    false
  );

  const errors = _.compact(metadataQueries.map((query) => query.error));

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

  const metadatas = _.compact(
    metadataQueries.map(
      (query) => query.response?.data as InputResource<Metadata>
    )
  );

  if (metadatas.length) {
    return (
      <MetadataBulkEditor
        ref={ref}
        metadatas={metadatas}
        onSaved={onSaved}
        onPreviousClick={onPreviousClick}
        insideModal={insideModal}
      />
    );
  }

  return null;
});
