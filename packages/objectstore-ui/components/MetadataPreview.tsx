import { LoadingSpinner, useQuery } from "common-ui";
import { isObject, toPairs } from "lodash";
import Link from "next/link";
import ReactTable from "react-table";
import { ObjectStoreMessage } from "../intl/objectstore-intl";
import { Metadata } from "../types/objectstore-api";
import { FileView } from "./file-view/FileView";

interface MetadataPreviewProps {
  metadataId: string;
}

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

    const builtInAttributeValues = toPairs(metadata)
      .map(([name, value]) => ({
        name,
        value
      }))
      .filter(p => !isObject(p.value));

    const managedAttributeValues = metadata.managedAttributeMap
      ? toPairs(metadata.managedAttributeMap.values).map(ma => ma[1])
      : [];

    return (
      <>
        <div>
          <Link href={`/metadata/edit?ids=${metadataId}`}>
            <a className="btn btn-primary">
              <ObjectStoreMessage id="editButtonText" />
            </a>
          </Link>
        </div>
        <a href={filePath}>
          <FileView filePath={filePath} fileType={fileType} />
        </a>
        <div className="form-group">
          <h4>Built-in Attributes</h4>
          <ReactTable
            className="-striped"
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
            data={builtInAttributeValues}
            pageSize={builtInAttributeValues.length || 1}
            showPagination={false}
          />
        </div>
        <div className="form-group">
          <h4>Managed Attributes</h4>
          <ReactTable
            className="-striped"
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
        <div className="form-group">
          <h4>Tags</h4>
          {metadata.acTags?.length
            ? metadata.acTags.map(tag => (
                <span
                  style={{
                    background: "#AEB404",
                    borderRadius: "25px",
                    margin: "0.5rem",
                    padding: "0.5rem"
                  }}
                >
                  {tag}
                </span>
              ))
            : "None"}
        </div>
      </>
    );
  }

  return null;
}
