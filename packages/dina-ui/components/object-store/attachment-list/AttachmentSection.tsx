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
   *
   * If provided, value and onChange do not need to be provided. This should be used if within a
   * formik component
   */
  name?: string;

  /**
   * Current metadata to be displayed in the editor.
   *
   * Should be used if formik is not available. Must be set with the onChange prop.
   */
  value?: ResourceIdentifierObject[];

  /**
   * Set the current metadata on change.
   *
   * Should be used if formik is not available. Must be set with the value prop.
   */
  onChange?: (newMetadatas: ResourceIdentifierObject[]) => void;

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
  value,
  onChange,
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

  // If value and onChange are provided (modal context), use them directly
  if (value && onChange) {
    const metadatas = _.uniqBy(value, "id") ?? [];

    return (
      <AttachmentSectionContent
        metadatas={metadatas}
        onDetachMetadataIds={onDetachMetadataIdsInternal}
        afterMetadatasSaved={afterMetadatasSavedInternal}
        allowAttachmentsConfig={allowAttachmentsConfig}
        lastSave={lastSave}
        readOnly={readOnly}
      />
    );
  }

  // Otherwise use FieldSpy for form context
  if (!name) {
    throw new Error(
      "Either 'name' or 'value' and 'onChange' must be provided."
    );
  }

  return (
    <FieldSpy fieldName={name}>
      {(value) => {
        const metadatas =
          _.uniqBy(value as ResourceIdentifierObject[] | undefined, "id") ?? [];

        return (
          <AttachmentSectionContent
            metadatas={metadatas}
            onDetachMetadataIds={onDetachMetadataIdsInternal}
            afterMetadatasSaved={afterMetadatasSavedInternal}
            allowAttachmentsConfig={allowAttachmentsConfig}
            lastSave={lastSave}
            readOnly={readOnly}
          />
        );
      }}
    </FieldSpy>
  );
}

interface AttachmentSectionContentProps {
  metadatas: ResourceIdentifierObject[];
  onDetachMetadataIds?: (metadataIds: string[]) => Promise<void>;
  afterMetadatasSaved: (metadataIds: string[]) => Promise<void>;
  allowAttachmentsConfig: AllowAttachmentsConfig;
  lastSave: number;
  readOnly?: boolean;
}

function AttachmentSectionContent({
  metadatas,
  onDetachMetadataIds,
  afterMetadatasSaved,
  allowAttachmentsConfig,
  lastSave,
  readOnly
}: AttachmentSectionContentProps) {
  const totalAttachments = metadatas.length;

  return (
    <FieldSet
      key={lastSave}
      legend={
        <>
          <DinaMessage id="attachments" />{" "}
          {totalAttachments > 0 ? <span>({totalAttachments})</span> : null}
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
              onDetachMetadataIds={onDetachMetadataIds}
              onMetadatasEdited={() => {}}
            />
          </TabPanel>
        )}
        {allowAttachmentsConfig.allowNew && (
          <TabPanel>
            <AttachmentUploader afterMetadatasSaved={afterMetadatasSaved} />
          </TabPanel>
        )}
        {allowAttachmentsConfig.allowExisting && (
          <TabPanel>
            <ExistingObjectsAttacher
              onMetadataIdsSubmitted={afterMetadatasSaved}
            />
          </TabPanel>
        )}
      </Tabs>
    </FieldSet>
  );
}
