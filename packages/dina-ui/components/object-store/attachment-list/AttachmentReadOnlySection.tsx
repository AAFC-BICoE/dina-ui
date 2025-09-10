import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingAttachmentsTable } from "./ExistingAttachmentsTable";
import { TotalAttachmentsIndicator } from "./TotalAttachmentsIndicator";
import { ReactNode, useState } from "react";
import { FieldSet, useQuery } from "common-ui";

export interface AttachmentReadOnlySectionProps {
  /**
   * The name of the attachment field.
   *
   * e.g. "attachment" for an Assemblage entity which has "attachment" relationship.
   */
  name: string;

  /**
   * The base API of the parent entity to which the attachments will be associated.
   *
   * e.g. "collection-api" for an Assemblage entity which has "attachment" relationship.
   */
  attachmentParentBaseApi: string;

  /**
   * ID of the parent entity to which attachments will be associated.
   *
   * e.g. the ID of an Assemblage entity which has "attachment" relationship.
   */
  attachmentParentId: string;

  /**
   * Type of the parent entity to which attachments will be associated.
   *
   * e.g. "assemblages" for an Assemblage entity which has "attachment" relationship.
   */
  attachmentParentType: string;

  detachTotalSelected?: boolean;

  title?: ReactNode;
}

export function AttachmentReadOnlySection({
  name,
  attachmentParentBaseApi,
  attachmentParentId,
  attachmentParentType,
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

  const attachmentPath = `${attachmentParentBaseApi}/${attachmentParentType}/${attachmentParentId}?include=${name}`;

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
        />
      )}
    </FieldSet>
  );
}
