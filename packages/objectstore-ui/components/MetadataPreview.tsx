import { LoadingSpinner, useQuery } from "common-ui";
import { toPairs } from "lodash";
import dynamic from "next/dynamic";
import { ComponentType } from "react";
import ReactTable from "react-table";
import { ObjectStoreMessage } from "../intl/objectstore-intl";
import { Metadata } from "../types/objectstore-api";

interface MetadataPreviewProps {
  metadataId: string;
}

// The FileViewer component can't be server-side rendered:
const FileViewer: ComponentType<any> = dynamic(
  () => import("react-file-viewer"),
  { ssr: false }
);

export function MetadataPreview({ metadataId }: MetadataPreviewProps) {
  const { loading, response } = useQuery<Metadata>({
    path: `metadata/${metadataId}?include=managedAttributeMap`
  });

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const filePath = `/api/v1/file/${metadata.bucket}/${metadata.fileIdentifier}`;
    const fileType = metadata.fileExtension.replace(/\./, "").toLowerCase();

    const managedAttributeValues = metadata.managedAttributeMap
      ? toPairs(metadata.managedAttributeMap.values).map(ma => ma[1])
      : [];

    return (
      <div className="h-100">
        <div>
          <FileViewer filePath={filePath} fileType={fileType} />
        </div>
        <ReactTable
          columns={[
            {
              Header: <ObjectStoreMessage id="attributeLabel" />,
              accessor: "name"
            },
            {
              Header: <ObjectStoreMessage id="managedAttributeValueLabel" />,
              accessor: "value"
            }
          ]}
          data={managedAttributeValues}
          pageSize={managedAttributeValues.length || 1}
          showPagination={false}
        />
      </div>
    );
  }

  return null;
}
