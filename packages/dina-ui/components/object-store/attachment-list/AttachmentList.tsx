import { useQuery } from "common-ui";
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
  onDetachMetadataIds,
  afterMetadatasSaved
}: AttachmentListProps) {
  const { response: attachmentsRes } = useQuery<[]>({ path: attachmentPath });
  const totalAttachments = attachmentsRes?.data?.length;

  return (
    <div>
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
            onDetachMetadataIds={onDetachMetadataIds}
          />
        </TabPanel>
        <TabPanel>
          <AttachmentUploader afterMetadatasSaved={afterMetadatasSaved} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
