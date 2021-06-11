import { FieldSet } from "common-ui";
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
import { ExistingObjectsAttacher } from "./ExistingObjectsAttacher";
import { TotalAttachmentsIndicator } from "./TotalAttachmentsIndicator";

export interface AttachmentListProps
  extends Omit<
      ExistingAttachmentsTableProps,
      "onMetadatasEdited" | "attachmentPath"
    >,
    AttachmentUploaderProps {
  /**
   * API path to the attachment list.
   * Omitting this gets rid of the Existing Attachments UI.
   */
  attachmentPath?: string;

  /** Manually set whether new/existing attachments can be added. By default allow both. */
  allowAttachmentsConfig?: AllowAttachmentsConfig;
}

export interface AllowAttachmentsConfig {
  allowNew?: boolean;
  allowExisting?: boolean;
}

/** UI section for reading and modifying file attachments. */
export function AttachmentSection({
  attachmentPath,
  onDetachMetadataIds: onDetachMetadataIdsProp,
  afterMetadatasSaved: afterMetadatasSavedProp,
  allowAttachmentsConfig = { allowExisting: true, allowNew: true }
}: AttachmentListProps) {
  const [lastSave, setLastSave] = useState(Date.now());

  async function afterMetadatasSavedInternal(metadataIds: string[]) {
    await afterMetadatasSavedProp(metadataIds);
    resetComponent();
  }
  async function onDetachMetadataIdsInternal(metadataIds: string[]) {
    await onDetachMetadataIdsProp?.(metadataIds);
    resetComponent();
  }

  // After updating Attachments, reset to initial component state:
  async function resetComponent() {
    setLastSave(Date.now());
  }

  return (
    <FieldSet
      key={lastSave}
      legend={
        <>
          <DinaMessage id="attachments" />{" "}
          {attachmentPath && (
            <TotalAttachmentsIndicator
              attachmentPath={attachmentPath}
              lastSave={lastSave}
            />
          )}
        </>
      }
    >
      <Tabs>
        <TabList>
          {attachmentPath && (
            <Tab>
              <DinaMessage id="existingAttachments" />
            </Tab>
          )}
          <Tab disabled={!allowAttachmentsConfig.allowNew}>
            <DinaMessage id="uploadNewAttachments" />
          </Tab>
          <Tab disabled={!allowAttachmentsConfig.allowExisting}>
            <DinaMessage id="attachExistingObjects" />
          </Tab>
        </TabList>
        {attachmentPath && (
          <TabPanel>
            <ExistingAttachmentsTable
              attachmentPath={attachmentPath}
              onDetachMetadataIds={onDetachMetadataIdsInternal}
              onMetadatasEdited={resetComponent}
            />
          </TabPanel>
        )}
        <TabPanel>
          <AttachmentUploader
            afterMetadatasSaved={afterMetadatasSavedInternal}
          />
        </TabPanel>
        <TabPanel>
          <ExistingObjectsAttacher
            onMetadataIdsSubmitted={afterMetadatasSavedInternal}
          />
        </TabPanel>
      </Tabs>
    </FieldSet>
  );
}
