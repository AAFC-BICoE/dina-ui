import { KitsuResource } from "kitsu";
import { get } from "lodash";
import Link from "next/link";
import { TableColumn8 } from "packages/common-ui/lib/list-page/types";
import { FaExternalLinkAlt } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";
import { Derivative } from "../../types/objectstore-api";

export function thumbnailCell({ bucketField }) {
  return {
    Cell: ({ original }) => {
      const bucket = get<string | undefined>(original, bucketField);
      const derivativeType =
        original?.included?.derivative?.attributes?.derivativeType;
      const filePath =
        derivativeType === "THUMBNAIL_IMAGE"
          ? `/objectstore-api/file/${bucket}/derivative/${original?.included?.derivative?.attributes?.fileIdentifier}`
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
            href={`/object-store/object/external-resource-view?id=${original?.id}`}
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

export function thumbnailCell8<TData extends KitsuResource>({
  bucketField
}): TableColumn8<TData> {
  return {
    id: "thumbnailColumn",
    cell: ({ row: { original } }) => {
      const bucket = get<string | undefined>(original as any, bucketField);
      const derivatives: any[] | undefined = (original as any)?.included
        ?.derivative;
      const thumbnailDerivative = derivatives?.find(
        (derivative) =>
          derivative.attributes.derivativeType === "THUMBNAIL_IMAGE"
      );
      const filePath = thumbnailDerivative
        ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.attributes.fileIdentifier}`
        : "";
      const resourceExternalURL = (original as any)?.data?.attributes
        ?.resourceExternalURL;
      const hasExternalResourceDerivative =
        resourceExternalURL && (original as any)?.included?.derivative;
      return resourceExternalURL ? (
        <div className="d-flex h-100">
          {hasExternalResourceDerivative ? (
            <FaExternalLinkAlt className="m-auto h5" />
          ) : (
            <Link href={resourceExternalURL} passHref={true}>
              <a target="_blank" className="m-auto h5">
                <FaExternalLinkAlt />
              </a>
            </Link>
          )}
          {hasExternalResourceDerivative && (
            <SmallThumbnail filePath={filePath} />
          )}
          <Link
            href={`/object-store/object/external-resource-view?id=${original?.id}`}
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
    enableSorting: false,
    header: () => <DinaMessage id="thumbnail" />,
    // These fields are required in the elastic search response for this cell to work.
    additionalAccessors: [
      "included.attributes.fileIdentifier",
      "included.attributes.derivativeType",
      "data.attributes.resourceExternalURL",
      "data.relationships.derivatives",
      bucketField
    ]
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
