import { KitsuResource } from "kitsu";
import { get } from "lodash";
import Link from "next/link";
import { TableColumn8 } from "packages/common-ui/lib/list-page/types";
import { FaExternalLinkAlt } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";
import { Derivative } from "../../types/objectstore-api";

export interface ThumbnailCellProps {
  bucketField: string;
  isJsonApiQuery?: boolean;
}

export function ThumbnailCell({
  bucketField,
  isJsonApiQuery
}: ThumbnailCellProps) {
  return {
    Cell: ({ original }) => {
      const bucket = get(original as any, bucketField);
      let derivatives: any[] | undefined = (original as any)?.included
        ?.derivative;
      let thumbnailDerivative = derivatives?.find(
        (derivative) =>
          derivative.attributes.derivativeType === "THUMBNAIL_IMAGE"
      );
      let filePath = thumbnailDerivative
        ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.attributes.fileIdentifier}`
        : "";
      let resourceExternalURL = (original as any)?.data?.attributes
        ?.resourceExternalURL;
      let hasExternalResourceDerivative =
        resourceExternalURL && (original as any)?.included?.derivative;
      if (isJsonApiQuery) {
        derivatives = (original as any)?.metadata
          ? (original as any)?.metadata.derivatives
          : (original as any)?.derivatives;
        thumbnailDerivative = derivatives?.find(
          (derivative) => derivative.derivativeType === "THUMBNAIL_IMAGE"
        );
        filePath = thumbnailDerivative
          ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.fileIdentifier}`
          : "";
        resourceExternalURL = (original as any)?.data?.attributes
          ?.resourceExternalURL;
        hasExternalResourceDerivative =
          resourceExternalURL && (original as any)?.included?.derivative;
      }
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
    sortable: false,
    Header: <DinaMessage id="thumbnail" />,
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

export interface ThumbnailCell8Props {
  bucketField: string;
  isJsonApiQuery?: boolean;
}

export function ThumbnailCell8<TData extends KitsuResource>({
  bucketField,
  isJsonApiQuery
}: ThumbnailCell8Props): TableColumn8<TData> {
  return {
    id: "thumbnailColumn",
    cell: ({ row: { original } }) => {
      const bucket = get(original as any, bucketField);
      let derivatives: any[] | undefined = (original as any)?.included
        ?.derivative;
      let thumbnailDerivative = derivatives?.find(
        (derivative) =>
          derivative.attributes.derivativeType === "THUMBNAIL_IMAGE"
      );
      let filePath = thumbnailDerivative
        ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.attributes.fileIdentifier}`
        : "";
      let resourceExternalURL = (original as any)?.data?.attributes
        ?.resourceExternalURL;
      let hasExternalResourceDerivative =
        resourceExternalURL && (original as any)?.included?.derivative;
      if (isJsonApiQuery) {
        derivatives = (original as any)?.metadata
          ? (original as any)?.metadata.derivatives
          : (original as any)?.derivatives;
        thumbnailDerivative = derivatives?.find(
          (derivative) => derivative.derivativeType === "THUMBNAIL_IMAGE"
        );
        filePath = thumbnailDerivative
          ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.fileIdentifier}`
          : "";
        resourceExternalURL = (original as any)?.data?.attributes
          ?.resourceExternalURL;
        hasExternalResourceDerivative =
          resourceExternalURL && (original as any)?.included?.derivative;
      }
      return resourceExternalURL ? (
        <div className="d-flex h-100">
          {hasExternalResourceDerivative ? (
            <FaExternalLinkAlt className="m-auto me-2 h5" />
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
