import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingAttachmentsTable } from "./ExistingAttachmentsTable";
import { TotalAttachmentsIndicator } from "./TotalAttachmentsIndicator";
import { ReactNode, useState } from "react";
import { FieldSet, useQuery } from "common-ui";

export interface AttachmentReadOnlySectionProps {
  attachmentPath: string;
  detachTotalSelected?: boolean;
  title?: ReactNode;
}

export function AttachmentReadOnlySection({
  attachmentPath,
  detachTotalSelected,
  title
}: AttachmentReadOnlySectionProps) {
  // JSX key to reload the child components after editing Metadatas.
  const [lastSave, setLastSave] = useState<number>();

  // Just check if the object-store is up:
  const { error } = useQuery<[]>(
    { path: "objectstore-api/metadata" },
    { deps: [lastSave] }
  );

  return (
    <FieldSet
      key={lastSave}
      legend={
        <>
          {title ?? <DinaMessage id="attachments" />}{" "}
          <TotalAttachmentsIndicator attachmentPath={attachmentPath} />
        </>
      }
    >
      {error ? (
        <DinaMessage id="objectStoreDataUnavailable" />
      ) : (
        <ExistingAttachmentsTable
          attachmentPath={attachmentPath}
          onMetadatasEdited={() => setLastSave(Date.now())}
          detachTotalSelected={detachTotalSelected}
          readOnly={true}
        />
      )}
    </FieldSet>
  );
}
