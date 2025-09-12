import { FieldSet, FieldSpy } from "common-ui";
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
import { ResourceIdentifierObject } from "jsonapi-typescript";
import _ from "lodash";

export interface AttachmentListProps
  extends Omit<
      ExistingAttachmentsTableProps,
      "onMetadatasEdited" | "metadatas"
    >,
    AttachmentUploaderProps {
  /**
   * Form field name for the attachments.
   */
  name: string;

  readOnly: boolean;

  /** Manually set whether new/existing attachments can be added. By default allow both. */
  allowAttachmentsConfig?: AllowAttachmentsConfig;
}

export interface AllowAttachmentsConfig {
  allowNew?: boolean;
  allowExisting?: boolean;
}

/** UI section for reading and modifying file attachments. */
export function AttachmentSection({
  name,
  readOnly,
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
                <DinaMessage id="attachments" />{" "}
                {totalAttachments > 0 ? (
                  <span>({totalAttachments})</span>
                ) : null}
              </>
            }
          >
            <Tabs>
              <TabList>
                {readOnly && (
                  <Tab>
                    <DinaMessage id="existingAttachments" />
                  </Tab>
                )}
                {allowAttachmentsConfig.allowNew && (
                  <Tab>
                    <DinaMessage id="uploadNewAttachments" />
                  </Tab>
                )}
                {allowAttachmentsConfig.allowExisting && (
                  <Tab>
                    <DinaMessage id="attachExistingObjects" />
                  </Tab>
                )}
              </TabList>
              {readOnly && (
                <TabPanel>
                  <ExistingAttachmentsTable
                    metadatas={metadatas}
                    onDetachMetadataIds={onDetachMetadataIdsInternal}
                    onMetadatasEdited={resetComponent}
                  />
                </TabPanel>
              )}
              {allowAttachmentsConfig.allowNew && (
                <TabPanel>
                  <AttachmentUploader
                    afterMetadatasSaved={afterMetadatasSavedInternal}
                  />
                </TabPanel>
              )}
              {allowAttachmentsConfig.allowExisting && (
                <TabPanel>
                  <ExistingObjectsAttacher
                    onMetadataIdsSubmitted={afterMetadatasSavedInternal}
                  />
                </TabPanel>
              )}
            </Tabs>
          </FieldSet>
        );
      }}
    </FieldSpy>
  );
}
