import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingAttachmentsTable } from "./ExistingAttachmentsTable";
import { ReactNode, useState } from "react";
import { FieldSet, useQuery, FieldSpy } from "common-ui";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import _ from "lodash";

export interface AttachmentReadOnlySectionProps {
  name: string;
  detachTotalSelected?: boolean;

  title?: ReactNode;
}

export function AttachmentReadOnlySection({
  name,
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
    <FieldSpy fieldName={name}>
      {(value) => {
        const metadatas =
          _.uniqBy(value as ResourceIdentifierObject[] | undefined, "id") ?? [];
        const totalAttachments = metadatas.length;

        return (
          <FieldSet
            key={lastSave}
            legend={
              <>
                {title ?? <DinaMessage id="attachments" />}{" "}
                {totalAttachments > 0 ? (
                  <span>({totalAttachments})</span>
                ) : null}
              </>
            }
          >
            {error ? (
              <DinaMessage id="objectStoreDataUnavailable" />
            ) : (
              <ExistingAttachmentsTable
                metadatas={metadatas}
                onMetadatasEdited={() => setLastSave(Date.now())}
                detachTotalSelected={detachTotalSelected}
              />
            )}
          </FieldSet>
        );
      }}
    </FieldSpy>
  );
}
