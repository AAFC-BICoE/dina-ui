import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingAttachmentsTable } from "./ExistingAttachmentsTable";
import { TotalAttachmentsIndicator } from "./TotalAttachmentsIndicator";
import { useState } from "react";

export interface AttachmentReadOnlySection {
  attachmentPath: string;
  detachTotalSelected?: boolean;
}

export function AttachmentReadOnlySection({
  attachmentPath,
  detachTotalSelected
}: AttachmentReadOnlySection) {
  // JSX key to reload the child components after editing Metadatas.
  const [lastSave, setLastSave] = useState<number>();

  return (
    <div key={lastSave}>
      <h2>
        <DinaMessage id="attachments" />{" "}
        <TotalAttachmentsIndicator attachmentPath={attachmentPath} />
      </h2>
      <ExistingAttachmentsTable
        attachmentPath={attachmentPath}
        onMetadatasEdited={() => setLastSave(Date.now())}
        detachTotalSelected={detachTotalSelected}
      />
    </div>
  );
}
