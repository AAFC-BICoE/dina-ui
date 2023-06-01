import { get } from "lodash";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";
import { FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

export function thumbnailCell({ bucketField }) {
  return {
    Cell: ({ original }) => {
      const bucket = get<string | undefined>(original, bucketField);
      const derivativeType =
        original.included.derivative.attributes.derivativeType;
      const filePath =
        derivativeType === "THUMBNAIL_IMAGE"
          ? `/objectstore-api/file/${bucket}/derivative/${original.included.derivative.attributes.fileIdentifier}`
          : "";
      const resourceExternalURL =
        original?.data?.attributes?.resourceExternalURL;

      return resourceExternalURL ? (
        <div className="d-flex h-100">
          <Link href={resourceExternalURL} passHref={true}>
            <a target="_blank" className="m-auto h5">
              <FaExternalLinkAlt />
            </a>
          </Link>

          <Link
            href={`/object-store/object/external-resource-view?id=${original.id}`}
          >
            <a className="m-auto">
              <DinaMessage id="detailsPageLink" />
            </a>
          </Link>
        </div>
      ) : (
        <SmallThumbnail filePath={filePath} />
      );
    },
    sortable: false,
    Header: <DinaMessage id="thumbnail" />,
    // These fields are required in the elastic search response for this cell to work.
    additionalAccessors: [
      "included.attributes.fileIdentifier",
      "included.attributes.derivativeType",
      "data.attributes.resourceExternalURL",
      bucketField
    ]
  };
}

export function thumbnailCell8({
  fileIdentifierField,
  bucketField
}): ColumnDef<any> {
  return {
    id: "thumbnailColumn",
    cell: ({ row: { original } }) => {
      const fileIdentifier = get<string | undefined>(
        original,
        fileIdentifierField
      );
      const bucket = get<string | undefined>(original, bucketField);

      const fileId = `${fileIdentifier}/thumbnail`;
      const filePath = `/objectstore-api/file/${bucket}/${fileId}`;
      const resourceExternalURL =
        original?.data?.attributes?.resourceExternalURL;

      return resourceExternalURL ? (
        <div className="d-flex h-100">
          <Link href={resourceExternalURL} passHref={true}>
            <a target="_blank" className="m-auto h5">
              <FaExternalLinkAlt />
            </a>
          </Link>

          <Link
            href={`/object-store/object/external-resource-view?id=${original.id}`}
          >
            <a className="m-auto">
              <DinaMessage id="detailsPageLink" />
            </a>
          </Link>
        </div>
      ) : (
        <SmallThumbnail filePath={filePath} />
      );
    },
    header: () => <DinaMessage id="thumbnail" />

    // // These fields are required in the elastic search response for this cell to work.
    // additionalAccessors: [
    //   "data.attributes.resourceExternalURL",
    //   fileIdentifierField,
    //   bucketField
    // ]
  };
}

function SmallThumbnail({ filePath }) {
  const { formatMessage } = useDinaIntl();

  const height = "5rem";

  return (
    <div style={{ maxHeight: height }}>
      <FileView
        filePath={filePath}
        fileType="jpg"
        imgAlt={formatMessage("thumbnailNotAvailableText")}
        imgHeight={height}
      />
    </div>
  );
}
