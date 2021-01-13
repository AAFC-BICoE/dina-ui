import { useQuery } from "common-ui";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  AttachmentUploader,
  AttachmentUploaderProps
} from "./AttachmentUploader";
import {
  ExistingAttachmentsTable,
  ExistingAttachmentsTableProps
} from "./ExistingAttachmentsTable";

export interface AttachmentListProps
  extends ExistingAttachmentsTableProps,
    AttachmentUploaderProps {}

export function AttachmentList({
  attachmentPath,
  onDetachMetadataIds: onDetachMetadataIdsProp,
  afterMetadatasSaved: afterMetadatasSavedProp
}: AttachmentListProps) {
  const [lastSave, setLastSave] = useState(Date.now());

  const { response: attachmentsRes } = useQuery<[]>({ path: attachmentPath });
  const totalAttachments = attachmentsRes?.data?.length;

  async function afterMetadatasSavedInternal(metadataIds: string[]) {
    await afterMetadatasSavedProp(metadataIds);

    // After saving new Metadatas, reset to initial component state:
    setLastSave(Date.now());
  }
  async function onDetachMetadataIdsInternal(metadataIds: string[]) {
    await onDetachMetadataIdsProp(metadataIds);

    // After saving new Metadatas, reset to initial component state:
    setLastSave(Date.now());
  }

  return (
    <div key={lastSave}>
      <h2>
        <DinaMessage id="attachments" />{" "}
        {totalAttachments ? `(${totalAttachments})` : null}
      </h2>
      <Tabs>
        <TabList>
          <Tab>
            <DinaMessage id="existing" />
          </Tab>
          <Tab>
            <DinaMessage id="addNew" />
          </Tab>
        </TabList>
        <TabPanel>
          <ExistingAttachmentsTable
            attachmentPath={attachmentPath}
            onDetachMetadataIds={onDetachMetadataIdsInternal}
          />
        </TabPanel>
        <TabPanel>
          <AttachmentUploader
            afterMetadatasSaved={afterMetadatasSavedInternal}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
