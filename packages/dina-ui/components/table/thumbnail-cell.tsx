import { KitsuResource } from "kitsu";
import Link from "next/link";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { FaExternalLinkAlt } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";
import { Derivative } from "../../types/objectstore-api";
import { useMetadataThumbnailPath } from "../object-store/metadata/useMetadataThumbnailPath";

export interface ThumbnailCellProps {
  bucketField: string;
  isJsonApiQuery?: boolean;
}

export function ThumbnailCell<TData extends KitsuResource>({
  bucketField,
  isJsonApiQuery
}: ThumbnailCellProps): TableColumn<TData> {
  return {
    id: "thumbnailColumn",
    cell: ({ row: { original } }) => {
      const { resourceExternalURL, hasExternalResourceDerivative, filePath } =
        useMetadataThumbnailPath<TData>(original, bucketField, isJsonApiQuery);
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

export function SmallThumbnail({ filePath }) {
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
