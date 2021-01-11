import {
  ColumnDefinition,
  dateCell,
  FieldHeader,
  QueryTable,
  useQuery
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { FileUploader, FileUploaderOnSubmitArgs } from "..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useFileUpload } from "../file-upload/FileUploadProvider";

export interface AttachmentListProps {
  attachmentPath: string;
  postSaveRedirect: string;
  /** Test group value only; TODO replace with the collecting event's group. */
  group: string;
}

export function AttachmentList({
  attachmentPath,
  postSaveRedirect,
  group = "cnc"
}: AttachmentListProps) {
  const router = useRouter();
  const { uploadFiles } = useFileUpload();

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  const { response: attachmentsRes } = useQuery<[]>({ path: attachmentPath });
  const totalAttachments = attachmentsRes?.data?.length;

  const ATTACHMENT_TABLE_COLUMNS: ColumnDefinition<any>[] = [
    {
      Cell: ({ original: { id, metadata } }) =>
        metadata?.originalFilename ? (
          <Link href={`/object-store/object/view?id=${id}`}>
            {metadata?.originalFilename}
          </Link>
        ) : null,
      accessor: "metadata.originalFilename",
      Header: <FieldHeader name="originalFilename" />
    },
    {
      ...dateCell("metadata.acDigitizationDate"),
      Header: <FieldHeader name="acDigitizationDate" />
    },
    {
      ...dateCell("metadata.xmpMetadataDate"),
      Header: <FieldHeader name="xmpMetadataDate" />
    },
    {
      accessor: "metadata.acMetadataCreator.displayName",
      Header: <FieldHeader name="acMetadataCreator.displayName" />
    },
    {
      Cell: ({ original: { acTags } }) => <>{acTags?.join(", ")}</>,
      accessor: "metadata.acTags",
      Header: <FieldHeader name="acTags" />
    }
  ];

  async function onUploaderSubmit({ acceptedFiles }: FileUploaderOnSubmitArgs) {
    const objectUploads = await uploadFiles({ files: acceptedFiles, group });

    const objectUploadIds = objectUploads
      .map(({ fileIdentifier }) => fileIdentifier)
      .join(",");

    await router.push({
      pathname: "/object-store/metadata/edit",
      query: {
        group,
        objectUploadIds,
        postSaveRedirect
      }
    });
  }

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
          <QueryTable
            columns={ATTACHMENT_TABLE_COLUMNS}
            joinSpecs={[
              {
                apiBaseUrl: "/objectstore-api",
                idField: "id",
                joinField: "metadata",
                path: metadataRef => `metadata/${metadataRef.id}`
              }
            ]}
            omitPaging={true}
            path={attachmentPath}
            reactTableProps={{ sortable: false }}
            defaultPageSize={10000}
          />
        </TabPanel>
        <TabPanel>
          <FileUploader
            onSubmit={onUploaderSubmit}
            acceptedFileTypes={acceptedFileTypes}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
