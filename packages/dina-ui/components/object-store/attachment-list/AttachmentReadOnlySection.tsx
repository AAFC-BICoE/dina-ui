import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingAttachmentsTable } from "./ExistingAttachmentsTable";
import { TotalAttachmentsIndicator } from "./TotalAttachmentsIndicator";
import { useState } from "react";
import { useQuery } from "common-ui";

export interface AttachmentReadOnlySectionProps {
  attachmentPath: string;
  detachTotalSelected?: boolean;
}

export function AttachmentReadOnlySection({
  attachmentPath,
  detachTotalSelected
}: AttachmentReadOnlySectionProps) {
  // JSX key to reload the child components after editing Metadatas.
  const [lastSave, setLastSave] = useState<number>();

  // Just check if the object-store is up:
  const { error } = useQuery<[]>(
    { path: "objectstore-api/metadata" },
    { deps: [lastSave] }
  );

  return (
    <div key={lastSave}>
      <h2>
        <DinaMessage id="attachments" />{" "}
        <TotalAttachmentsIndicator attachmentPath={attachmentPath} />
      </h2>
      {error ? (
        <DinaMessage id="objectStoreDataUnavailable" />
      ) : (
        <ExistingAttachmentsTable
          attachmentPath={attachmentPath}
          onMetadatasEdited={() => setLastSave(Date.now())}
          detachTotalSelected={detachTotalSelected}
        />
      )}
    </div>
  );
}
